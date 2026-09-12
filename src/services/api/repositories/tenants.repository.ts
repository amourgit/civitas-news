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

  /** GET /tenants/v1/disponibilite/?sous_domaine=xxx -- vérification en direct pendant la saisie, revalidée de toute façon à la soumission. */
  async checkDisponibilite(sousDomaine: string): Promise<SousDomaineDisponibilite> {
    const response = await http.get.get<SousDomaineDisponibilite>({
      endpoint: TENANTS_ENDPOINTS.disponibilite,
      params: { sous_domaine: sousDomaine },
      schema: DisponibiliteSchema,
      requireAuth: false,
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
      // qu'un CRUD classique. Le défaut global (60s, BaseHttpService)
      // suffit dans la plupart des cas ; on le porte à 120s ici en marge
      // de sécurité spécifiquement pour cette requête, la plus coûteuse
      // de l'app.
      timeout: 120000,
    });
    return response.data;
  },
};
