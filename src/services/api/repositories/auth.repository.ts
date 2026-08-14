// ============================================================
// src/services/api/repositories/auth.repository.ts
// Accès réel au backend d'authentification (token_manager).
// C'est la SEULE couche du frontend qui doit connaître le contrat
// exact du backend (endpoints, formes de requête/réponse).
//
// État actuel du backend (Backend-Core-Base, branche civitas-news) :
// login / register / google / refresh / logout / sessions / check-token
// fonctionnent tous — voir token_manager/api/v1/views.py.
// ============================================================

import { http } from './httpClient';
import { tokenStore } from '../token/tokenStore';
import { AUTH_ENDPOINTS } from '../endpoints';
import { TokenPairSchema, AccessTokenResponseSchema, SessionsListResponseSchema } from '../../../types/models/backend.types';
import type { TokenPair, SessionInfo } from '../../../types/models/backend.types';

export interface RegisterPayload {
  identifiant: string;
  password: string;
}

export const authRepository = {
  /**
   * POST /token/v1/ — authentifie l'utilisateur et stocke les tokens.
   * `identifiant` est un email OU un numéro de téléphone (le backend
   * détermine automatiquement lequel, voir
   * users/api/v1/services.py:get_user_by_identifiant côté backend) — un
   * SEUL champ, pas de distinction à faire côté frontend.
   *
   * Si aucun compte ne correspond à `identifiant`, le backend répond
   * 404 avec `code: 'ACCOUNT_NOT_FOUND'` (propagé sur `ApiError.code`,
   * voir BaseHttpService.handleResponse) — LoginPage s'en sert pour
   * proposer la création du compte plutôt que d'afficher une simple
   * erreur, mais SEULEMENT dans ce cas précis (jamais sur un mot de
   * passe incorrect pour un identifiant existant, `code:
   * 'INVALID_CREDENTIALS'`, pour ne jamais créer de doublon quand
   * l'utilisateur a juste oublié son mot de passe).
   */
  async login(identifiant: string, password: string): Promise<TokenPair> {
    const response = await http.post.post<{ identifiant: string; password: string }, TokenPair>({
      endpoint: AUTH_ENDPOINTS.login,
      body: { identifiant, password },
      responseSchema: TokenPairSchema,
      requireAuth: false,
    });
    tokenStore.setTokens({ access: response.data.access, refresh: response.data.refresh });
    return response.data;
  },

  /**
   * POST /token/v1/register/ — crée le compte puis auto-connecte
   * (même forme de réponse que login : {access, refresh, device_info}).
   * Inscription simplifiée à un seul `identifiant` (email OU téléphone)
   * + mot de passe — voir IdentifiantRegisterSerializer côté backend.
   */
  async register(payload: RegisterPayload): Promise<TokenPair> {
    const response = await http.post.post<RegisterPayload, TokenPair>({
      endpoint: AUTH_ENDPOINTS.register,
      body: payload,
      responseSchema: TokenPairSchema,
      requireAuth: false,
    });
    tokenStore.setTokens({ access: response.data.access, refresh: response.data.refresh });
    return response.data;
  },

  /**
   * POST /token/v1/google/ — connexion ou inscription via Google
   * Identity Services. `credential` est le id_token JWT tel que reçu
   * du callback GSI côté frontend (voir components/auth/GoogleSignInButton.tsx) ;
   * sa signature et son audience sont vérifiées côté serveur avant
   * toute confiance dans son contenu.
   */
  async loginWithGoogle(credential: string): Promise<TokenPair> {
    const response = await http.post.post<{ credential: string }, TokenPair>({
      endpoint: AUTH_ENDPOINTS.googleLogin,
      body: { credential },
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
