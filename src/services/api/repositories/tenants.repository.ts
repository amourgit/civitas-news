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

// Pas de `listMine()` / liste "mes tenants" ici : ce serait une table
// globale user↔tenant utilisée comme source d'autorisation, exactement
// ce que l'architecture cible interdit (chaque tenant gère ses propres
// membres, aucune identité globale ne les relie entre eux). Le switch
// rapide entre tenants déjà visités est un pur historique LOCAL, voir
// store/tenants.store.ts (recentTenants) — il ne vient pas du backend.

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
};
