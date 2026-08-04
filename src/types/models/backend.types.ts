// ============================================================
// src/types/models/backend.types.ts
// Types reflétant EXACTEMENT ce que Backend-Core-Base (branche
// civitas-news) renvoie aujourd'hui — par opposition aux modèles
// "cibles" du reste de src/types/models/*.ts qui décrivent ce que
// le frontend affiche. Utilisés uniquement par la couche
// services/api/repositories/.
// ============================================================

import { z } from 'zod';

/** Utilisateur Django "brut", tel que renvoyé par users/api/v1/serializers.py */
export const BackendUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().optional().nullable(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  is_active: z.boolean().optional(),
  date_joined: z.string().optional(),
});
export type BackendUser = z.infer<typeof BackendUserSchema>;

/** Réponse de POST /token/v1/ (CustomTokenObtainPairView) */
export const TokenPairSchema = z.object({
  access: z.string(),
  refresh: z.string(),
  device_info: z.record(z.string(), z.unknown()).optional(),
});
export type TokenPair = z.infer<typeof TokenPairSchema>;

/** Réponse de POST /token/v1/refresh/ */
export const AccessTokenResponseSchema = z.object({
  access: z.string(),
});
export type AccessTokenResponse = z.infer<typeof AccessTokenResponseSchema>;

export const SessionInfoSchema = z.object({
  id: z.number(),
  device_info: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string().optional(),
  last_used: z.string().optional(),
  is_current: z.boolean().optional(),
  device_family: z.string().optional(),
  device_brand: z.string().optional(),
  device_model: z.string().optional(),
  device_type: z.string().optional(),
  os_family: z.string().optional(),
  browser_family: z.string().optional(),
  ip_address: z.string().optional(),
});
export type SessionInfo = z.infer<typeof SessionInfoSchema>;

export const SessionsListResponseSchema = z.object({
  sessions: z.array(SessionInfoSchema),
});
