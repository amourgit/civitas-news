// ============================================================
// src/services/api/repositories/users.repository.ts
// Accès réel au backend Users (users/api/v1).
// ============================================================

import { http } from './httpClient';
import { USERS_ENDPOINTS } from '../endpoints';
import {
  BackendUserSchema, type BackendUser,
  type BackendUserEcriturePayload, type BackendUserCreationPayload,
} from '../../../types/models/backend.types';
import { UtilisateurSchema, type Utilisateur } from '../../../types/models/user.types';
import { paginatedSchema, fetchAllPages } from '../utils/pagination';

export const usersRepository = {
  /**
   * GET /users/v1/users/me/ — profil de l'utilisateur authentifié
   * courant. Cette action utilise UtilisateurPublicSerializer côté
   * backend (users/api/v1/views.py:UserViewSet.me), PAS UserSerializer
   * — la réponse a donc la forme riche (role, badges, stats,
   * nomAffiche, avatar), pas la forme brute des autres actions du
   * ModelViewSet (list/retrieve/update -> UserSerializer).
   */
  async me(): Promise<Utilisateur> {
    const response = await http.get.get<Utilisateur>({
      endpoint: USERS_ENDPOINTS.me,
      schema: UtilisateurSchema,
      requireAuth: true,
    });
    return response.data;
  },

  /** GET /users/v1/users/ — liste (réservé aux rôles habilités côté backend). */
  async list(): Promise<BackendUser[]> {
    return fetchAllPages<BackendUser>(async (page) => {
      const response = await http.get.get({
        endpoint: USERS_ENDPOINTS.list,
        params: { page },
        schema: paginatedSchema(BackendUserSchema),
        requireAuth: true,
      });
      return { results: response.data.results, next: response.data.next };
    });
  },

  /** `fresh: true` contourne le cache GET applicatif -- pour relire une
   * fiche qu'on vient de modifier, sans dépendre de la politique
   * d'invalidation globale (voir cache/getCache.ts). */
  async getById(id: number, options: { fresh?: boolean } = {}): Promise<BackendUser> {
    const response = await http.get.get<BackendUser>({
      endpoint: USERS_ENDPOINTS.detail(id),
      schema: BackendUserSchema,
      requireAuth: true,
      ...(options.fresh ? { cache: 'no-cache' as const } : {}),
    });
    return response.data;
  },

  /** POST /users/v1/users/ — réservé aux superusers côté backend (UserCreateSerializer). */
  async create(payload: BackendUserCreationPayload): Promise<BackendUser> {
    const response = await http.post.post<BackendUserCreationPayload, BackendUser>({
      endpoint: USERS_ENDPOINTS.create,
      body: payload,
      responseSchema: BackendUserSchema,
      requireAuth: true,
    });
    return response.data;
  },

  /** PATCH — réservé aux modérateurs/administrateurs côté backend (voir
   * UserViewSet.permission_classes). Passe par UserUpdateSerializer, qui
   * n'inclut PAS `username`/`badges`/`isStaff`/`isSuperuser`/`dateJoined` :
   * ces champs sont ignorés s'ils sont présents dans `data`.
   *
   * Deux particularités, toutes deux verrouillées par
   * __tests__/users.repository.test.ts :
   *  - `preserveNull` : `null` est une INSTRUCTION pour DRF (vider une FK
   *    ou la date de naissance). Le sanitizer par défaut le retirerait
   *    et la modification serait perdue en silence.
   *  - la réponse du PATCH est rendue par UserUpdateSerializer, donc sans
   *    `id`/`username`/`badges` : elle ne peut pas être validée par
   *    BackendUserSchema (elle faisait échouer toute sauvegarde). On
   *    relit la fiche complète après l'écriture -- ce qui rend aussi les
   *    champs en lecture seule (badges, dates) à jour. */
  async update(id: number, data: Partial<BackendUserEcriturePayload>): Promise<BackendUser> {
    await http.update.patch<Partial<BackendUserEcriturePayload>, unknown>({
      endpoint: USERS_ENDPOINTS.list,
      resourceId: id,
      patches: data,
      preserveNull: true,
      requireAuth: true,
    });
    return usersRepository.getById(id, { fresh: true });
  },

  async remove(id: number): Promise<void> {
    await http.delete.delete({ endpoint: USERS_ENDPOINTS.list, resourceId: id, requireAuth: true });
  },

  async changePassword(id: number, oldPassword: string, newPassword: string): Promise<void> {
    await http.post.post<{ old_password: string; new_password: string }, unknown>({
      endpoint: USERS_ENDPOINTS.changePassword(id),
      body: { old_password: oldPassword, new_password: newPassword },
      requireAuth: true,
    });
  },
};
