// ============================================================
// src/types/models/backend.types.ts
// Types reflétant EXACTEMENT ce que Backend-Core-Base (branche
// civitas-news) renvoie aujourd'hui — par opposition aux modèles
// "cibles" du reste de src/types/models/*.ts qui décrivent ce que
// le frontend affiche. Utilisés uniquement par la couche
// services/api/repositories/.
// ============================================================

import { z } from 'zod';

/** Utilisateur Django "brut", tel que renvoyé par users/api/v1/serializers.py:UserSerializer
 * (endpoint /users/v1/users/, réservé au backoffice — modérateurs/administrateurs).
 *
 * IMPORTANT — casse : `CamelCaseJSONRenderer` (common/camel_case.py) est
 * le renderer DRF PAR DÉFAUT, appliqué globalement sans exception (voir
 * REST_FRAMEWORK.DEFAULT_RENDERER_CLASSES, config/settings.py) — y
 * compris sur UserViewSet, qui ne le surcharge pas. La sortie réelle de
 * CET endpoint est donc bien en camelCase comme partout ailleurs dans
 * l'API (`firstName`, `isActive`, `dateJoined`...), PAS en snake_case
 * (le schéma déclarait auparavant des clés snake_case, jamais confronté
 * à une vraie réponse puisqu'aucune UI ne consommait encore ce endpoint
 * — voir le commentaire d'origine dans user.types.ts).
 */
export const BackendUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().optional().nullable(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  isStaff: z.boolean().optional(),
  isSuperuser: z.boolean().optional(),
  dateJoined: z.string().optional(),
  lastLogin: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().nullable().optional(),
  /** Rôle applicatif — voir users/models.py:RoleUtilisateur ('anonyme' n'est jamais stocké). */
  role: z.enum(['etudiant', 'moderateur', 'administrateur', 'organisation']).optional(),
  /** FK — identifiant numérique brut (pas l'objet imbriqué), pour peupler un <select> côté backoffice. */
  etablissement: z.number().nullable().optional(),
  organisation: z.number().nullable().optional(),
  badges: z
    .array(z.object({ id: z.string(), nom: z.string(), icone: z.string(), description: z.string().optional() }))
    .optional(),
  languagePreference: z.string().optional(),
  timezone: z.string().optional(),
});
export type BackendUser = z.infer<typeof BackendUserSchema>;

/** Payload d'écriture — voir UserUpdateSerializer côté backend (mot de
 * passe volontairement absent, géré par changePassword séparément).
 * Clés en camelCase : re-converties en snake_case côté serveur par
 * `CamelCaseJSONParser`, également global (voir DEFAULT_PARSER_CLASSES). */
export interface BackendUserEcriturePayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  isVerified?: boolean;
  role?: 'etudiant' | 'moderateur' | 'administrateur' | 'organisation';
  etablissement?: number | null;
  organisation?: number | null;
  phoneNumber?: string;
  address?: string;
  dateOfBirth?: string | null;
}

/** Payload de création — voir UserCreateSerializer côté backend (réservé aux superusers). */
export interface BackendUserCreationPayload {
  username: string;
  password: string;
  password2: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

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
