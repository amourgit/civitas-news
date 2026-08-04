// ============================================================
// src/services/auth.service.ts
// Service Authentification — contrairement aux domaines de contenu
// (news, commentaires, ...), l'authentification a un backend RÉEL
// et fonctionnel dès aujourd'hui (Backend-Core-Base : token_manager
// + users). Ce service appelle donc toujours le vrai backend via
// services/api/repositories/, indépendamment de env.useMockData.
//
// Important : ce service n'est PAS encore branché sur le flux de
// connexion actuel de l'application (src/store/auth.store.ts, qui
// reste en mode démo avec des utilisateurs prédéfinis). Deux raisons :
//   1) Le backend n'expose aujourd'hui aucun endpoint d'inscription
//      publique (users/api/v1/views.py : UserViewSet.create exige
//      IsSuperUser) — il faudra l'ajouter côté backend avant de
//      pouvoir remplacer le flux de RegisterPage.tsx.
//   2) Le modèle User du backend n'a pas encore les champs enrichis
//      attendus par le frontend (avatar, role, badges, stats,
//      etablissement) — voir types/models/backend.types.ts.
//
// Ce service est en revanche entièrement fonctionnel et prêt à être
// branché dès que ces deux points seront traités côté backend.
// ============================================================

import { authRepository } from './api/repositories/auth.repository';
import { usersRepository } from './api/repositories/users.repository';
import type { BackendUser, TokenPair, SessionInfo } from '../types/models/backend.types';

export const authService = {
  /** Authentifie via /token/v1/ (username + password) et stocke les tokens. */
  async loginWithPassword(username: string, password: string): Promise<TokenPair> {
    return authRepository.login(username, password);
  },

  async logout(): Promise<void> {
    return authRepository.logout();
  },

  /** Profil brut de l'utilisateur authentifié (GET /users/v1/users/me/). */
  async getCurrentUser(): Promise<BackendUser | null> {
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
