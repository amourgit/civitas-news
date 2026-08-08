// ============================================================
// src/services/api/repositories/users.repository.ts
// Accès réel au backend Users (users/api/v1).
// ============================================================

import { http } from './httpClient';
import { USERS_ENDPOINTS } from '../endpoints';
import { BackendUserSchema, type BackendUser } from '../../../types/models/backend.types';
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

  async getById(id: number): Promise<BackendUser> {
    const response = await http.get.get<BackendUser>({
      endpoint: USERS_ENDPOINTS.detail(id),
      schema: BackendUserSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async update(id: number, data: Partial<BackendUser>): Promise<BackendUser> {
    const response = await http.update.patch<Partial<BackendUser>, BackendUser>({
      endpoint: USERS_ENDPOINTS.list,
      resourceId: id,
      patches: data,
      responseSchema: BackendUserSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async changePassword(id: number, oldPassword: string, newPassword: string): Promise<void> {
    await http.post.post<{ old_password: string; new_password: string }, unknown>({
      endpoint: USERS_ENDPOINTS.changePassword(id),
      body: { old_password: oldPassword, new_password: newPassword },
      requireAuth: true,
    });
  },
};
