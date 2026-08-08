// ============================================================
// src/store/auth.store.ts
// Store d'authentification réel — remplace l'ancien mode démo
// (loginAsStudent/loginAsAdmin/loginAsAnonymous, utilisateurs fabriqués
// en mémoire) par de vrais appels à token_manager/users côté backend.
//
// Pattern : même "store maison" (pas de lib externe) que tokenStore.ts
// — un état de module partagé, notifié à un Set de listeners React via
// useState+useEffect. `user` reste TOUJOURS défini (jamais null) avec
// un objet ANONYMOUS_USER par défaut : c'est le contrat déjà attendu
// par usePermissions.ts, CommentThread.tsx, CreerNewsPage.tsx, qui
// lisent `user.role` sans vérification de nullité.
// ============================================================

import { useEffect, useState } from 'react';
import type { Utilisateur } from '../types/models/user.types';
import { authRepository, type RegisterPayload } from '../services/api/repositories/auth.repository';
import { usersRepository } from '../services/api/repositories/users.repository';
import { tokenStore } from '../services/api/token/tokenStore';
import { hasPermission, hasAnyPermission, canOnResource } from '../lib/permissions/hasPermission';
import type { Permission } from '../lib/permissions/permissions.catalog';

export const ANONYMOUS_USER: Utilisateur = {
  id: 'anonyme',
  username: 'anonyme',
  nomAffiche: 'Visiteur',
  role: 'anonyme',
  badges: [],
  stats: { contributions: 0, votes: 0, commentaires: 0 },
};

/**
 * - 'idle'    : rien n'a encore été tenté (état initial, avant montage).
 * - 'loading' : hydratation initiale OU login/register/logout en cours.
 * - 'ready'   : état stable, `user` reflète la session réelle (authentifiée ou non).
 */
export type AuthStatus = 'idle' | 'loading' | 'ready';

let currentUser: Utilisateur = ANONYMOUS_USER;
let currentStatus: AuthStatus = 'idle';
let hydrationStarted = false;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function setState(user: Utilisateur, status: AuthStatus): void {
  currentUser = user;
  currentStatus = status;
  notify();
}

/**
 * Restaure la session depuis le token stocké (cookie, voir
 * services/api/token/tokenStore.ts) au démarrage de l'app. Idempotente
 * et auto-déclenchée par le premier composant qui monte
 * useAuthStore() — inutile de l'appeler manuellement.
 */
async function hydrate(): Promise<void> {
  if (hydrationStarted) return;
  hydrationStarted = true;

  if (!tokenStore.isAuthenticated()) {
    setState(ANONYMOUS_USER, 'ready');
    return;
  }

  setState(currentUser, 'loading');
  try {
    const profile = await usersRepository.me();
    setState(profile, 'ready');
  } catch {
    // Token illisible et refresh impossible (authFetchInterceptor a déjà
    // tenté un refresh silencieux avant que cette erreur ne remonte ici,
    // voir authFetchInterceptor.ts) -> session considérée terminée.
    tokenStore.clear();
    setState(ANONYMOUS_USER, 'ready');
  }
}

// Une session peut se terminer de façon EXTERNE à une action explicite
// de ce store : refresh token expiré pendant l'utilisation (l'intercepteur
// fetch appelle tokenStore.clear() dans ce cas). On réagit pour que
// l'UI retombe immédiatement en état anonyme plutôt que de continuer à
// afficher un utilisateur dont la session n'existe plus côté serveur.
tokenStore.subscribe((accessToken) => {
  if (!accessToken && currentUser.role !== 'anonyme') {
    setState(ANONYMOUS_USER, 'ready');
  }
});

export function useAuthStore() {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const handleChange = () => forceRender((n) => n + 1);
    listeners.add(handleChange);
    void hydrate();
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const user = currentUser;
  const status = currentStatus;

  /** POST /token/v1/ puis GET /users/v1/users/me/. Lève une ApiError (message lisible) en cas d'échec. */
  const login = async (username: string, password: string): Promise<Utilisateur> => {
    setState(currentUser, 'loading');
    try {
      await authRepository.login(username, password);
      const profile = await usersRepository.me();
      setState(profile, 'ready');
      return profile;
    } catch (error) {
      setState(currentUser, 'ready');
      throw error;
    }
  };

  /** POST /token/v1/register/ (auto-connexion) puis GET /users/v1/users/me/. */
  const register = async (payload: RegisterPayload): Promise<Utilisateur> => {
    setState(currentUser, 'loading');
    try {
      await authRepository.register(payload);
      const profile = await usersRepository.me();
      setState(profile, 'ready');
      return profile;
    } catch (error) {
      setState(currentUser, 'ready');
      throw error;
    }
  };

  /** POST /token/v1/google/ avec le id_token Google Identity Services. */
  const loginWithGoogle = async (credential: string): Promise<Utilisateur> => {
    setState(currentUser, 'loading');
    try {
      await authRepository.loginWithGoogle(credential);
      const profile = await usersRepository.me();
      setState(profile, 'ready');
      return profile;
    } catch (error) {
      setState(currentUser, 'ready');
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    setState(currentUser, 'loading');
    try {
      await authRepository.logout(); // révoque le token côté serveur puis tokenStore.clear()
    } catch {
      // Le serveur est peut-être injoignable — on efface quand même la
      // session localement, mieux vaut un faux-négatif (déconnecté côté
      // client, encore actif côté serveur jusqu'à expiration naturelle)
      // qu'un utilisateur bloqué en session "zombie".
      tokenStore.clear();
    } finally {
      setState(ANONYMOUS_USER, 'ready');
    }
  };

  return {
    user,
    status,
    isHydrating: status === 'idle' || status === 'loading',
    isAuthenticated: user.role !== 'anonyme',
    isAnonymous: user.role === 'anonyme',
    isAdmin: user.role === 'administrateur' || user.role === 'moderateur',
    login,
    register,
    loginWithGoogle,
    logout,
    /** Vérification fine des permissions — voir src/lib/permissions/. */
    can: (permission: Permission) => hasPermission(user, permission),
    canAny: (permissions: Permission[]) => hasAnyPermission(user, permissions),
    canOnResource: (baseAction: 'news:edit' | 'news:delete' | 'commentaire:delete', resourceOwnerId: string | undefined) =>
      canOnResource(user, baseAction, resourceOwnerId),
  };
}
