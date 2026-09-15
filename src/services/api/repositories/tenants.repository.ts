// ============================================================
// src/services/api/repositories/tenants.repository.ts
// Accès au backend Tenants (tenants/api/v1) : annuaire public (page
// d'accueil, section "Organisations" -- chaque tenant EST une
// organisation, voir components/home/OrganisationsSection.tsx) +
// création self-service d'un nouveau tenant avec son premier
// administrateur (architecture tenant-autonome : cet administrateur
// n'existe QUE dans le schéma de ce nouveau tenant, voir
// Tenant.create_with_domain côté backend).
//
// Pas de `listMine()` / liste "mes tenants" ici : ce serait une table
// globale user<->tenant utilisée comme source d'autorisation, exactement
// ce que l'architecture cible interdit (chaque tenant gère ses propres
// membres, aucune identité globale ne les relie entre eux). Le switch
// rapide entre tenants déjà visités est un pur historique LOCAL, voir
// store/tenants.store.ts (recentTenants) -- il ne vient pas du backend.
// ============================================================

import { z } from 'zod';
import { http } from './httpClient';
import { TENANTS_ENDPOINTS } from '../endpoints';

export const TenantCreatePayloadSchema = z.object({
  name: z.string().min(1).max(100),
  sousDomaine: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Lettres minuscules, chiffres et tirets uniquement'),
  description: z.string().max(2000).optional(),
  identifiant: z.string().min(1),
  password: z.string().min(8).max(128),
});
export type TenantCreatePayload = z.infer<typeof TenantCreatePayloadSchema>;

export const TenantSchema = z.object({
  id: z.number(),
  name: z.string(),
  sousDomaine: z.string(),
  logo: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  // Ajoutés pour la réforme multi-tenant des GET (voir
  // store/tenants.store.ts::getTenantHeaderListValue) : `domain` est la
  // valeur EXACTE à poser dans X-Tenant-Domain pour ce tenant (calculée
  // côté backend, TenantPublicSerializer.get_domain -- jamais reconstruite
  // ici depuis sousDomaine), `isPublic` reflète Tenant.is_public. Optionnels
  // pour ne rien casser côté TenantCreateResponse, qui réutilise ce même
  // schéma mais ne s'intéresse pas à ces deux champs.
  domain: z.string().nullable().optional(),
  isPublic: z.boolean().optional(),
});
export type Tenant = z.infer<typeof TenantSchema>;

const TenantCreateResponseSchema = z.object({
  tenant: TenantSchema,
  domaine: z.string(),
  admin: z.object({ identifiant: z.string() }),
});
export type TenantCreateResponse = z.infer<typeof TenantCreateResponseSchema>;

const DisponibiliteSchema = z.object({
  sousDomaine: z.string(),
  disponible: z.boolean(),
  formatValide: z.boolean(),
});
export type SousDomaineDisponibilite = z.infer<typeof DisponibiliteSchema>;

export const tenantsRepository = {
  /** GET /tenants/v1/ -- annuaire public des tenants actifs. */
  async list(): Promise<Tenant[]> {
    const response = await http.get.get<Tenant[]>({
      endpoint: TENANTS_ENDPOINTS.create,
      schema: z.array(TenantSchema),
      requireAuth: false,
    });
    return response.data;
  },

  /**
   * GET /tenants/v1/publics/ -- tenants is_public=true, destinés à être
   * ajoutés (en plus du tenant courant) dans X-Tenant-Domain sur CHAQUE
   * requête GET -- voir store/tenants.store.ts::getTenantHeaderListValue,
   * qui consomme le résultat via setPublicTenants(). Appel simple, mono-
   * tenant (pas de `multiTenant: true` ici) : GetService replie déjà
   * automatiquement l'enveloppe backend sur le tenant principal par
   * défaut, exactement la forme attendue par ce schéma.
   */
  async publicList(): Promise<Tenant[]> {
    const response = await http.get.get<Tenant[]>({
      endpoint: TENANTS_ENDPOINTS.publics,
      schema: z.array(TenantSchema),
      requireAuth: false,
    });
    return response.data;
  },

  /** GET /tenants/v1/disponibilite/?sous_domaine=xxx -- vérification en direct pendant la saisie, revalidée de toute façon à la soumission. */
  async checkDisponibilite(sousDomaine: string): Promise<SousDomaineDisponibilite> {
    const response = await http.get.get<SousDomaineDisponibilite>({
      endpoint: TENANTS_ENDPOINTS.disponibilite,
      params: { sous_domaine: sousDomaine },
      schema: DisponibiliteSchema,
      requireAuth: false,
      // Vérification "en direct" par nature (voir commentaire ci-dessus) :
      // exclue du cache GET par défaut (20s, voir GetService.ts) pour ne
      // jamais répondre "disponible" à partir d'une réponse mise en
      // cache pendant que l'utilisateur retape la même chaîne.
      cache: 'no-cache',
    });
    return response.data;
  },

  /** POST /tenants/v1/ -- crée le tenant + son premier administrateur (compte propre à ce tenant, aucun rôle ailleurs). */
  async create(payload: TenantCreatePayload): Promise<TenantCreateResponse> {
    const response = await http.post.post<TenantCreatePayload, TenantCreateResponse>({
      endpoint: TENANTS_ENDPOINTS.create,
      body: payload,
      bodySchema: TenantCreatePayloadSchema,
      responseSchema: TenantCreateResponseSchema,
      requireAuth: false,
      // Provisionne un schéma Postgres + toutes ses migrations côté
      // backend (voir Tenant.create_with_domain) : nettement plus lent
      // qu'un CRUD classique, et le temps réel dépend de la charge du
      // moment -- 120s s'est révélé encore insuffisant. `timeout: 0` a
      // un sens précis ici (voir BaseHttpService.createAbortController :
      // `if (timeoutMs > 0)` -- 0 ne pose simplement AUCUN minuteur
      // d'abandon) : on attend aussi longtemps qu'il faut, sans jamais
      // couper nous-mêmes tant que le backend n'a pas répondu.
      //
      // AUCUN retry ici, et ça n'a rien d'un oubli : cette requête N'EST
      // PAS idempotente (elle crée un tenant + son administrateur) --
      // la moindre re-tentative automatique après un simple ralentissement
      // (le cas normal ici, pas une vraie panne) créerait un DOUBLON
      // (deux organisations, ou un conflit de sous-domaine) au lieu de
      // récupérer proprement. `retry` reste donc délibérément absent
      // (voir BaseHttpService.executeWithRetry : pas de config -> pas de
      // nouvelle tentative, jamais un défaut implicite qui réessaierait
      // dans notre dos).
      //
      // Reste un point hors de portée du frontend : un proxy/passerelle
      // intermédiaire (ex: le service Render du backend) peut fermer la
      // connexion de son propre chef avant que ce délai illimité ne
      // s'applique -- rien ne peut compenser ça côté client seul.
      timeout: 0,
    });
    return response.data;
  },
};
