// ============================================================
// src/services/api/auth.service.ts
// Service Authentification — façade fine au-dessus de
// services/api/repositories/{auth,users}.repository.ts.
//
// src/store/auth.store.ts (consommé par les composants React) appelle
// directement ces repositories plutôt que ce service, pour garder son
// cycle login -> hydratation du profil -> notification des listeners
// atomique. Ce service reste utile hors contexte React (scripts,
// tests, code non-composant) où le hook useAuthStore() ne s'applique
// pas.
// ============================================================

import { authRepository, type RegisterPayload } from './repositories/auth.repository';
import { usersRepository } from './repositories/users.repository';
import type { Utilisateur } from '../../types/models/user.types';
import type { TokenPair, SessionInfo } from '../../types/models/backend.types';

export const authService = {
  /** Authentifie via /token/v1/ (username + password) et stocke les tokens. */
  async loginWithPassword(username: string, password: string): Promise<TokenPair> {
    return authRepository.login(username, password);
  },

  /** Inscription self-service via /token/v1/register/ (auto-connexion). */
  async register(payload: RegisterPayload): Promise<TokenPair> {
    return authRepository.register(payload);
  },

  /** Connexion/inscription via /token/v1/google/ (id_token Google Identity Services). */
  async loginWithGoogle(credential: string): Promise<TokenPair> {
    return authRepository.loginWithGoogle(credential);
  },

  async logout(): Promise<void> {
    return authRepository.logout();
  },

  /** Profil enrichi de l'utilisateur authentifié (GET /users/v1/users/me/ -> UtilisateurPublicSerializer). */
  async getCurrentUser(): Promise<Utilisateur | null> {
    if (!authRepository.isAuthenticated()) return null;
    try {
      return await usersRepository.me();
    } catch {
      return null;
    }
  },

  async refreshToken(): Promise<string | null> {
    return authRepository.refreshAccessToken();
  },

  async listSessions(): Promise<SessionInfo[]> {
    return authRepository.listSessions();
  },

  async revokeSession(sessionId: string | number): Promise<void> {
    return authRepository.revokeSession(sessionId);
  },

  isAuthenticated(): boolean {
    return authRepository.isAuthenticated();
  },
};

/** Alias de compatibilité ascendante (nom historique du service). */
export const authBackendService = authService;
