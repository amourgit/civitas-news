// ============================================================
// src/services/api/publicTenantsLifecycle.ts
// Réforme multi-tenant des GET : au démarrage, puis à intervalle
// régulier, on interroge GET /tenants/v1/publics/ (tenants
// is_public=true) et on met à jour store/tenants.store.ts::
// setPublicTenants -- c'est cette liste, combinée au tenant courant,
// que authFetchInterceptor.ts pose dans X-Tenant-Domain pour CHAQUE
// requête GET (voir store/tenants.store.ts::getTenantHeaderListValue).
//
// Pattern "lifecycle" identique à token/tokenLifecycle.ts (état de
// module + start/stop idempotents) -- volontairement plus simple ici :
// pas de backoff/retry élaboré, un rafraîchissement raté se rattrape
// simplement au prochain battement d'intervalle, la liste précédente
// (déjà en store + localStorage) restant valable entre-temps.
// ============================================================

import { tenantsRepository } from './repositories/tenants.repository';
import { setPublicTenants, type TenantRef } from '../../store/tenants.store';

// Les tenants publics (Ministères, Mutuelles...) sont déclarés par une
// action administrative explicite, pas quelque chose qui change d'une
// minute à l'autre -- 5 minutes absorbe l'essentiel du besoin de
// fraîcheur ("ou à intervalle de temps", explicitement demandé) sans
// bombarder le backend d'un annuaire qui bouge rarement.
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

// Attendue par authFetchInterceptor.ts (waitForFirstPublicTenantsRefresh)
// avant de poser X-Tenant-Domain sur le tout premier GET de la session :
// sans ça, ce premier GET -- tiré quasi immédiatement après
// createRoot(...).render() dans main.tsx, souvent AVANT que ce module
// ait eu la moindre chance de répondre -- partait toujours sans aucun
// tenant public, même une fois `Tenant.is_public` réellement peuplé
// côté backend. Particulièrement sensible avec un cold start Render
// (jusqu'à 30-60s) : un visiteur sans cache localStorage encore frais
// pouvait rater les tenants publics sur PLUSIEURS requêtes de suite, pas
// juste la toute première. Bornée à READY_TIMEOUT_MS : on ne bloque
// JAMAIS un GET indéfiniment derrière un backend lent -- passé ce délai,
// la requête part avec ce qui est déjà connu (store courant,
// potentiellement vide), exactement le comportement d'avant ce correctif.
const READY_TIMEOUT_MS = 3000;

let started = false;
let intervalTimer: ReturnType<typeof setInterval> | null = null;
let firstRefreshPromise: Promise<void> | null = null;

/**
 * Un seul appel réseau + mise à jour du store. Exportée séparément de
 * start() pour rester appelable isolément (ex: bouton "rafraîchir" côté
 * admin, ou test unitaire ciblé) sans dépendre du minuteur périodique.
 * Échec silencieux (log uniquement) : la liste précédente en cache
 * (store + localStorage) reste utilisée telle quelle, jamais vidée sur
 * un simple accroc réseau.
 */
export async function refreshPublicTenants(): Promise<void> {
  try {
    const tenants = await tenantsRepository.publicList();
    const refs: TenantRef[] = tenants
      .filter((tenant): tenant is typeof tenant & { domain: string } => Boolean(tenant.domain))
      .map((tenant) => ({ domainHeaderValue: tenant.domain, name: tenant.name }));
    setPublicTenants(refs);
  } catch (error) {
    console.warn('[publicTenantsLifecycle] Échec du rafraîchissement des tenants publics', error);
  }
}

/**
 * Démarre le rafraîchissement (immédiat, puis toutes les
 * REFRESH_INTERVAL_MS) -- idempotent, à appeler une fois depuis
 * main.tsx, indépendamment de tout état d'authentification : la liste
 * des tenants publics est utile même à un visiteur anonyme (routes
 * TENANT_PUBLIC en lecture, voir config/config.py côté backend).
 */
export function startPublicTenantsLifecycle(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  firstRefreshPromise = refreshPublicTenants();
  intervalTimer = setInterval(() => void refreshPublicTenants(), REFRESH_INTERVAL_MS);
}

/** Arrête le minuteur -- utile en test pour repartir d'un état propre. */
export function stopPublicTenantsLifecycle(): void {
  started = false;
  firstRefreshPromise = null;
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
}

/**
 * Attend le tout PREMIER rafraîchissement de la session (déclenché par
 * startPublicTenantsLifecycle), borné à READY_TIMEOUT_MS -- voir le
 * commentaire sur cette constante ci-dessus. Sans effet perceptible
 * après le premier appel (promesse déjà résolue) : c'est UNIQUEMENT la
 * fenêtre entre le démarrage de l'app et la fin de ce premier appel
 * réseau que ce correctif comble. `refreshPublicTenants` ne rejette
 * jamais (voir son propre try/catch) -- `Promise.race` ici ne sert donc
 * qu'à borner la LATENCE, jamais à intercepter une erreur.
 */
export function waitForFirstPublicTenantsRefresh(): Promise<void> {
  if (!firstRefreshPromise) return Promise.resolve();
  return Promise.race([
    firstRefreshPromise,
    new Promise<void>((resolve) => setTimeout(resolve, READY_TIMEOUT_MS)),
  ]);
}
