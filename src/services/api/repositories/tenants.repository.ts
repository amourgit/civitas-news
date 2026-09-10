// ============================================================
// src/services/api/repositories/tenants.repository.ts
// Accès réel au backend Tenants (tenants/api/v1). Opération
// généralement réservée à la mise en place d'une nouvelle
// organisation cliente sur la plateforme.
// ============================================================

import { z } from 'zod';
import { http } from './httpClient';
import { TENANTS_ENDPOINTS } from '../endpoints';

export const TenantCreatePayloadSchema = z.object({
  name: z.string().max(100),
  sous_domaine: z.string().max(50),
  admin_email: z.string().email(),
  admin_password: z.string().max(128).optional(),
  admin_username: z.string().max(150).optional(),
});
export type TenantCreatePayload = z.infer<typeof TenantCreatePayloadSchema>;

const TenantSchema = z.object({
  id: z.number(),
  name: z.string(),
  sous_domaine: z.string(),
  schema_name: z.string(),
  is_active: z.boolean(),
  logo: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  settings: z.record(z.string(), z.unknown()).nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type BackendTenant = z.infer<typeof TenantSchema>;

// ------------------------------------------------------------------
// "Mes tenants" — un tenant dont l'utilisateur authentifié courant est
// membre (adhesions.MembreTenant côté backend), pour alimenter le
// store d'activation (voir store/tenants.store.ts).
//
// ⚠️ CONTRAT PROPOSÉ, PAS ENCORE IMPLÉMENTÉ CÔTÉ BACKEND au moment
// d'écrire ce fichier. `GET /tenants/v1/mine/` devra boucler tous les
// schémas tenant (même principe que
// token_manager/api/v1/services.py::TokenService.find_user_tenant,
// mais renvoyant la LISTE complète des adhésions ACCEPTEES de
// l'utilisateur au lieu du premier match) et répondre avec CE shape
// (camelCase — le renderer global est CamelCaseJSONRenderer, voir
// config/settings.py:REST_FRAMEWORK).
//
// `domainHeaderValue` est la valeur EXACTE à poser dans l'en-tête
// X-Tenant-Domain pour ce tenant (sous-domaine ou domaine explicitement
// enregistré, voir domain.Domain) — le frontend ne doit PAS tenter de
// la reconstruire lui-même à partir de `sousDomaine`.
// ------------------------------------------------------------------
const TenantMembershipSchema = z.object({
  id: z.number(),
  name: z.string(),
  sousDomaine: z.string(),
  domainHeaderValue: z.string(),
  logo: z.string().nullable().optional(),
  role: z.string(),
  statutAdhesion: z.string(),
  isActive: z.boolean(),
});
export type TenantMembership = z.infer<typeof TenantMembershipSchema>;

export const tenantsRepository = {
  /** POST /tenants/v1/ — crée un nouveau tenant (organisation cliente). */
  async create(payload: TenantCreatePayload): Promise<BackendTenant> {
    const response = await http.post.post<TenantCreatePayload, BackendTenant>({
      endpoint: TENANTS_ENDPOINTS.create,
      body: payload,
      bodySchema: TenantCreatePayloadSchema,
      responseSchema: TenantSchema,
      requireAuth: true,
    });
    return response.data;
  },

  /** GET /tenants/v1/mine/ — voir le commentaire de contrat ci-dessus. */
  async listMine(): Promise<TenantMembership[]> {
    const response = await http.get.get<TenantMembership[]>({
      endpoint: TENANTS_ENDPOINTS.mine,
      schema: z.array(TenantMembershipSchema),
      requireAuth: true,
    });
    return response.data;
  },
};
