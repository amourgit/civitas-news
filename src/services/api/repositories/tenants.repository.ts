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
  /** Optionnel -- envoyé en multipart si présent, voir tenantsRepository.create ci-dessous. */
  logo: z.instanceof(File).optional(),
});
export type TenantCreatePayload = z.infer<typeof TenantCreatePayloadSchema>;

/**
 * Fiche d'identité primaire d'un tenant -- voir
 * `tenants.models.TenantInformationsPrimaires` /
 * `TenantInformationsPrimairesSerializer` côté backend. Tous les champs
 * métier sont optionnels ici (le backend les accepte `blank=True`) :
 * c'est le stepper de création (`useCreerOrganisationForm`) qui impose
 * ses propres champs obligatoires côté UX, sur la base de
 * `TenantInformationsPrimaires.CHAMPS_COMPLETION`.
 */
export const TenantInformationsPrimairesSchema = z.object({
  id: z.string().optional(),
  tenant: z.string().optional(),
  statut: z.string().optional(),
  pourcentageCompletion: z.number().optional(),
  formeJuridique: z.string().nullable().optional(),
  secteurActivite: z.string().nullable().optional(),
  raisonSociale: z.string().nullable().optional(),
  sigle: z.string().nullable().optional(),
  numeroRccm: z.string().nullable().optional(),
  numeroNif: z.string().nullable().optional(),
  numeroAgrement: z.string().nullable().optional(),
  dateCreationOuAgrement: z.string().nullable().optional(),
  adresseSiege: z.string().nullable().optional(),
  ville: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  pays: z.string().nullable().optional(),
  telephonePrincipal: z.string().nullable().optional(),
  telephoneSecondaire: z.string().nullable().optional(),
  emailContact: z.string().nullable().optional(),
  siteWeb: z.string().nullable().optional(),
  reseauxSociaux: z.record(z.string(), z.string()).optional(),
  responsableNomComplet: z.string().nullable().optional(),
  responsableFonction: z.string().nullable().optional(),
  responsableTelephone: z.string().nullable().optional(),
  responsableEmail: z.string().nullable().optional(),
  contactOperationnelNom: z.string().nullable().optional(),
  contactOperationnelFonction: z.string().nullable().optional(),
  contactOperationnelTelephone: z.string().nullable().optional(),
  contactOperationnelEmail: z.string().nullable().optional(),
  effectifEstime: z.number().nullable().optional(),
  zoneCouverture: z.string().nullable().optional(),
  descriptionActivites: z.string().nullable().optional(),
  commentaireVerification: z.string().nullable().optional(),
  verifieLe: z.string().nullable().optional(),
  creeLe: z.string().optional(),
  modifieLe: z.string().optional(),
});
export type TenantInformationsPrimaires = z.infer<typeof TenantInformationsPrimairesSchema>;

/** Champs réellement modifiables par ce endpoint self-service (voir `read_only_fields` du serializer). */
export type TenantInformationsPrimairesEcriturePayload = Partial<
  Omit<
    TenantInformationsPrimaires,
    'id' | 'tenant' | 'statut' | 'pourcentageCompletion' | 'commentaireVerification' | 'verifieLe' | 'creeLe' | 'modifieLe'
  >
>;

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

/**
 * camelCase -> snake_case, une seule profondeur (suffisant pour ces
 * payloads plats) -- nécessaire uniquement pour le chemin MULTIPART de
 * `create()` ci-dessous : `CamelCaseJSONParser` (backend) ne s'applique
 * qu'aux requêtes JSON, jamais à `multipart/form-data` (voir la même
 * note dans news.repository.ts::toSnakeCaseKeys).
 */
function toSnakeCaseKeys(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    out[key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)] = value;
  }
  return out;
}

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
   * Identité PUBLIQUE d'une organisation à partir de son sous-domaine,
   * pour la page de détails d'une organisation consultée. Il n'existe
   * pas (encore) d'endpoint « un seul tenant » : on filtre l'annuaire
   * public. `null` si aucune organisation ne porte ce sous-domaine.
   */
  async getBySousDomaine(sousDomaine: string): Promise<Tenant | null> {
    const tenants = await tenantsRepository.list();
    const wanted = sousDomaine.toLowerCase();
    return tenants.find((t) => t.sousDomaine.toLowerCase() === wanted || t.domain?.toLowerCase() === wanted) ?? null;
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

  /**
   * POST /tenants/v1/ -- crée le tenant + son premier administrateur
   * (compte propre à ce tenant, aucun rôle ailleurs). Bascule en
   * multipart uniquement si un logo est fourni (`TenantCreateSerializer.logo`,
   * champ optionnel côté backend) -- sinon JSON standard, inchangé.
   */
  async create(payload: TenantCreatePayload): Promise<TenantCreateResponse> {
    const { logo, ...scalarFields } = payload;
    if (logo) {
      const response = await http.post.uploadFiles<TenantCreateResponse>({
        endpoint: TENANTS_ENDPOINTS.create,
        files: [logo],
        fieldName: 'logo',
        additionalFields: toSnakeCaseKeys(scalarFields),
        responseSchema: TenantCreateResponseSchema,
        requireAuth: false,
        timeout: 0,
      });
      return response.data;
    }
    const response = await http.post.post<Omit<TenantCreatePayload, 'logo'>, TenantCreateResponse>({
      endpoint: TENANTS_ENDPOINTS.create,
      body: scalarFields,
      bodySchema: TenantCreatePayloadSchema.omit({ logo: true }),
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

  /**
   * GET /tenants/v1/informations-primaires/ -- fiche d'identité du
   * tenant COURANT (résolu via X-Tenant-Domain + le token d'accès,
   * réservé à l'administrateur du tenant). Créée à la volée côté
   * backend au premier accès (`get_or_create`).
   */
  async getInformationsPrimaires(): Promise<TenantInformationsPrimaires> {
    const response = await http.get.get<TenantInformationsPrimaires>({
      endpoint: TENANTS_ENDPOINTS.informationsPrimaires,
      schema: TenantInformationsPrimairesSchema,
      requireAuth: true,
    });
    return response.data;
  },

  /**
   * PATCH /tenants/v1/informations-primaires/ -- ressource SINGLETON
   * (aucun id dans l'URL, une seule fiche par tenant). `UpdateService.patch`
   * exige un `resourceId` qu'il concatène systématiquement à l'endpoint
   * (voir buildResourceEndpoint) -- on exploite donc son support natif
   * du placeholder `{id}` avec un `resourceId` vide : `.../{id}` ->
   * `.../` une fois remplacé, sans toucher à l'infrastructure HTTP
   * partagée par tout le reste de l'app.
   */
  async updateInformationsPrimaires(
    payload: TenantInformationsPrimairesEcriturePayload,
  ): Promise<TenantInformationsPrimaires> {
    const response = await http.update.patch<TenantInformationsPrimairesEcriturePayload, TenantInformationsPrimaires>({
      endpoint: `${TENANTS_ENDPOINTS.informationsPrimaires}{id}`,
      resourceId: '',
      patches: payload,
      responseSchema: TenantInformationsPrimairesSchema,
      requireAuth: true,
    });
    return response.data;
  },
};
