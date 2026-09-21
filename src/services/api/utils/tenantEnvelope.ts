// ============================================================
// src/services/api/utils/tenantEnvelope.ts
// Réforme multi-tenant des GET (voir tenants/middleware.py ::
// TenantMiddleware._fan_out_get côté Backend-Core-Base, branche
// civitas-news) : le backend répond désormais à TOUTE requête GET
// tenant-scopée par un tableau JSON
//
//   [{ tenant: {...}, statusCode: 200, data: ... }, ...]
//
// -- un élément par tenant de la liste envoyée dans X-Tenant-Domain
// (le tenant courant de l'utilisateur, puis -- pour un GET -- tous les
// tenants is_public=true, voir store/tenants.store.ts ::
// getTenantHeaderListValue), TOUJOURS sous cette forme, même pour un
// seul tenant.
//
// Ce module centralise :
//   1) isTenantEnvelope / TenantEnvelopeEntrySchema -- reconnaître cette
//      forme sans la confondre avec une réponse "normale" (tableau nu,
//      objet paginé DRF...) ;
//   2) unwrapToPrimaryTenant -- le repli PAR DÉFAUT appliqué par
//      GetService.get() à CHAQUE réponse GET : ne garder que les
//      données du tenant PRINCIPAL (le premier de la liste, toujours le
//      tenant courant). Tout appelant existant, dont le schéma Zod a été
//      écrit pour la forme "sans enveloppe", continue de fonctionner
//      SANS AUCUNE MODIFICATION -- c'est le point de cette fonction ;
//   3) flattenPaginatedEnvelope -- pour les rares appelants qui veulent
//      explicitement la vue multi-tenant (`multiTenant: true`, voir
//      GetRequestConfig) : aplatit `[{tenant, data: {results}}, ...]`
//      (chaque tenant renvoyant une page DRF, voir utils/pagination.ts)
//      en une seule liste `{item, tenant}[]`, pour un fil combiné (ex:
//      News du tenant courant + des tenants publics).
// ============================================================

import { z } from 'zod';
import { ApiError } from '../errors';

/**
 * Métadonnées du tenant portées par chaque élément de l'enveloppe.
 * `schemaName` n'est présent qu'en DEBUG côté backend (jamais en
 * production) -- optionnel ici, jamais lu par le frontend.
 */
export const TenantEnvelopeRefSchema = z.object({
  id: z.number(),
  name: z.string(),
  sousDomaine: z.string(),
  isPublic: z.boolean(),
  schemaName: z.string().optional(),
});
export type TenantEnvelopeRef = z.infer<typeof TenantEnvelopeRefSchema>;

/** Schéma d'un élément de l'enveloppe -- `data` volontairement `unknown` :
 * sa forme varie avec `statusCode` (page DRF en succès, `{detail,...}`
 * en erreur) ; la validation fine du contenu utile est à la charge de
 * l'appelant (voir flattenPaginatedEnvelope). */
export const TenantEnvelopeEntrySchema = z.object({
  tenant: TenantEnvelopeRefSchema,
  statusCode: z.number(),
  data: z.unknown().nullable(),
});
/** Type "brut" tel qu'inféré par Zod (`data` structurellement optionnel,
 * ZodUnknown oblige) -- c'est CE type que produit réellement
 * `TenantEnvelopeEntrySchema.parse`/GetService, donc celui que les
 * fonctions ci-dessous acceptent en entrée. */
export type TenantEnvelopeEntryRaw = z.infer<typeof TenantEnvelopeEntrySchema>;

/** Type de CONFORT pour construire une enveloppe à la main (tests,
 * fixtures) avec `data` explicitement requis -- un objet qui le fournit
 * satisfait trivialement TenantEnvelopeEntryRaw ci-dessus. */
export interface TenantEnvelopeEntry<T = unknown> {
  tenant: TenantEnvelopeRef;
  statusCode: number;
  data: T | null;
}

/**
 * Détecte la forme `[{tenant, statusCode, data}, ...]`. Volontairement
 * un test STRUCTUREL bon marché (pas un `.parse()` Zod qui lèverait) :
 * appelé sur CHAQUE réponse GET par GetService avant même de savoir de
 * quel endpoint elle vient -- il doit rester silencieux et rapide face à
 * une réponse qui n'a simplement rien à voir (tableau nu, objet paginé,
 * `{detail, errorCode}` d'erreur classique...).
 */
export function isTenantEnvelope(value: unknown): value is TenantEnvelopeEntryRaw[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => TenantEnvelopeEntrySchema.safeParse(item).success)
  );
}

/**
 * Comportement PAR DÉFAUT de GetService.get() pour toute réponse GET :
 * ne garde que les données du tenant PRINCIPAL (le premier de la liste
 * -- toujours le tenant courant de l'utilisateur). Une réponse qui n'est
 * PAS l'enveloppe (endpoint appelé sans aucun tenant résolu, ex: domaine
 * racine) traverse inchangée.
 */
export function unwrapToPrimaryTenant(rawData: unknown): unknown {
  if (!isTenantEnvelope(rawData)) return rawData;
  const primary = rawData[0];
  // Le middleware répond TOUJOURS en HTTP 200 pour un GET fan-out, même si la
  // vue a échoué : l'échec du tenant principal vit dans `statusCode`. Sans
  // ce contrôle, un 404/403 métier `{detail}` était pris pour des données
  // valides puis rejeté par le schéma Zod de l'appelant (ValidationError
  // opaque, statut perdu) -- les appelants qui gèrent un 404 attendu
  // (ex : organisation inconnue) ne pouvaient donc pas le reconnaître.
  if (primary.statusCode >= 400) throw primaryTenantError(primary);
  return primary.data;
}

function primaryTenantError(entry: TenantEnvelopeEntryRaw): ApiError {
  const body = (entry.data ?? {}) as Record<string, unknown>;
  const pick = (...keys: string[]): string | undefined =>
    keys.map((key) => body[key]).find((value): value is string => typeof value === 'string' && value.length > 0);
  return new ApiError(
    pick('detail', 'error', 'message') ?? `Erreur HTTP ${entry.statusCode}`,
    entry.statusCode,
    pick('errorCode', 'code'),
    undefined,
    entry.data,
  );
}

/** Un élément aplati, associé au tenant qui l'a produit. */
export interface TenantScopedItem<T> {
  item: T;
  tenant: TenantEnvelopeRef;
}

/**
 * Aplatit une enveloppe multi-tenant dont chaque `data` est une page DRF
 * `{results: [...]}` (voir utils/pagination.ts::paginatedSchema) en une
 * seule liste `{item, tenant}[]`, chaque élément validé individuellement
 * contre `itemSchema` -- un item invalide (ou un tenant en erreur,
 * `statusCode >= 400`, ou sans `data`) est silencieusement ignoré,
 * exactement comme le backend ignore un hostname de tenant inconnu :
 * jamais de crash global pour une seule entrée fautive.
 *
 * Ne suit PAS `next` : une seule page par tenant. La pagination
 * indépendante de plusieurs tenants sur un même fil combiné (page 2 du
 * tenant A pendant que le tenant B est encore en page 1) est un
 * problème à part entière, volontairement hors scope ici -- un fil
 * combiné affiche la première page de chacun, voir
 * repositories/news.repository.ts::listAcrossTenants.
 */
export function flattenPaginatedEnvelope<TItem>(
  envelope: TenantEnvelopeEntryRaw[],
  itemSchema: z.ZodType<TItem>
): TenantScopedItem<TItem>[] {
  const flattened: TenantScopedItem<TItem>[] = [];
  for (const entry of envelope) {
    if (entry.statusCode >= 400 || entry.data == null) continue;
    const data = entry.data as { results?: unknown };
    const rawResults = Array.isArray(entry.data) ? entry.data : data.results;
    if (!Array.isArray(rawResults)) continue;
    for (const rawItem of rawResults) {
      const parsed = itemSchema.safeParse(rawItem);
      if (parsed.success) {
        flattened.push({ item: parsed.data, tenant: entry.tenant });
      }
    }
  }
  return flattened;
}
