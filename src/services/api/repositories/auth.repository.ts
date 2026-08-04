// ============================================================
// src/services/api/repositories/auth.repository.ts
// Accès réel au backend d'authentification (token_manager).
// C'est la SEULE couche du frontend qui doit connaître le contrat
// exact du backend (endpoints, formes de requête/réponse).
//
// État actuel du backend (Backend-Core-Base, branche civitas-news) :
//  ✅ login / refresh / logout / sessions / check-token fonctionnent
//  ❌ pas d'endpoint d'inscription publique (UserViewSet.create
//     exige IsSuperUser) — l'inscription self-service devra être
//     ajoutée côté backend avant de pouvoir remplacer le flux mock
//     de RegisterPage.tsx.
// ============================================================

import { http } from './httpClient';
import { tokenStore } from '../token/tokenStore';
import { AUTH_ENDPOINTS } from '../endpoints';
import { TokenPairSchema, AccessTokenResponseSchema, SessionsListResponseSchema } from '../../../types/models/backend.types';
import type { TokenPair, SessionInfo } from '../../../types/models/backend.types';

export const authRepository = {
  /** POST /token/v1/ — authentifie l'utilisateur et stocke les tokens. */
  async login(username: string, password: string): Promise<TokenPair> {
    const response = await http.post.post<{ username: string; password: string }, TokenPair>({
      endpoint: AUTH_ENDPOINTS.login,
      body: { username, password },
      responseSchema: TokenPairSchema,
      requireAuth: false,
    });
    tokenStore.setTokens({ access: response.data.access, refresh: response.data.refresh });
    return response.data;
  },

  /** POST /token/v1/refresh/ — renouvelle l'access token à partir du refresh token stocké. */
  async refreshAccessToken(): Promise<string | null> {
    const refresh = tokenStore.getRefreshToken();
    if (!refresh) return null;

    const response = await http.post.post<{ refresh: string }, { access: string }>({
      endpoint: AUTH_ENDPOINTS.refresh,
      body: { refresh },
      responseSchema: AccessTokenResponseSchema,
      requireAuth: false,
    });
    tokenStore.setTokens({ access: response.data.access, refresh });
    return response.data.access;
  },

  /** POST /token/v1/logout/ — révoque le token courant (Authorization envoyé automatiquement). */
  async logout(): Promise<void> {
    try {
      await http.post.post<Record<string, never>, { message: string }>({
        endpoint: AUTH_ENDPOINTS.logout,
        body: {},
        requireAuth: true,
      });
    } finally {
      tokenStore.clear();
    }
  },

  /** GET /token/v1/sessions/ — liste des sessions actives de l'utilisateur courant. */
  async listSessions(): Promise<SessionInfo[]> {
    const response = await http.get.get<{ sessions: SessionInfo[] }>({
      endpoint: AUTH_ENDPOINTS.sessions(),
      schema: SessionsListResponseSchema,
      requireAuth: true,
    });
    return response.data.sessions;
  },

  /** DELETE /token/v1/sessions/{id}/ — révoque une session distante (pas la session courante). */
  async revokeSession(sessionId: string | number): Promise<void> {
    await http.delete.delete({
      endpoint: AUTH_ENDPOINTS.sessions(sessionId),
      requireAuth: true,
    });
  },

  /** DELETE /token/v1/sessions/ — révoque toutes les sessions sauf la courante. */
  async revokeAllOtherSessions(): Promise<void> {
    await http.delete.delete({
      endpoint: AUTH_ENDPOINTS.sessions(),
      requireAuth: true,
    });
  },

  isAuthenticated(): boolean {
    return tokenStore.isAuthenticated();
  },
};
