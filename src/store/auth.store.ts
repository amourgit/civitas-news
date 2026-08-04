import { useState, useEffect } from 'react';
import type { Utilisateur } from '../types/global.types';
import { MOCK_ANONYMOUS_USER, MOCK_STUDENT_USER, MOCK_ADMIN_USER } from '../services/api/mocks/auth.mock';
import { hasPermission, hasAnyPermission, canOnResource } from '../lib/permissions/hasPermission';
import type { Permission } from '../lib/permissions/permissions.catalog';

export { MOCK_ANONYMOUS_USER, MOCK_STUDENT_USER, MOCK_ADMIN_USER };

const getInitialUser = (): Utilisateur => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('civitas_auth_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.role) {
          return parsed;
        }
      }
    } catch {
      // Ignore read errors
    }
  }
  return MOCK_ANONYMOUS_USER;
};

let currentUser: Utilisateur = getInitialUser();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function persistUser(user: Utilisateur) {
  if (typeof window !== 'undefined') {
    try {
      if (user.role === 'anonyme') {
        localStorage.removeItem('civitas_auth_user');
      } else {
        localStorage.setItem('civitas_auth_user', JSON.stringify(user));
      }
    } catch {
      // Ignore write errors
    }
  }
}

export function getCurrentUser(): Utilisateur {
  return currentUser;
}

export function setCurrentUser(user: Utilisateur) {
  currentUser = user;
  persistUser(user);
  notify();
}

export function useAuthStore() {
  const [user, setUser] = useState<Utilisateur>(currentUser);

  useEffect(() => {
    const handleChange = () => setUser(currentUser);
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const loginAsStudent = () => setCurrentUser(MOCK_STUDENT_USER);
  const loginAsAdmin = () => setCurrentUser(MOCK_ADMIN_USER);
  const loginAsAnonymous = () => setCurrentUser(MOCK_ANONYMOUS_USER);

  const loginWithGoogle = (payload?: { name?: string; email?: string; picture?: string }) => {
    const email = payload?.email || 'citoyen.google@gmail.com';
    const username = email.split('@')[0].replace(/[^\w]/g, '_');
    const googleUser: Utilisateur = {
      id: `usr-google-${Date.now()}`,
      username,
      nomAffiche: payload?.name || 'Samuel (Compte Google)',
      avatar:
        payload?.picture ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'etudiant',
      email,
      etablissement: 'Compte Authentifié Google',
      badges: [
        { id: 'b-google', nom: 'Vérifié Google', icone: '🌐', description: 'Compte authentifié avec Google' },
        { id: 'b-citoyen', nom: 'Citoyen Actif', icone: '🗳️', description: 'Membre de la communauté CIVITAS' },
      ],
      stats: { contributions: 3, votes: 15, commentaires: 8 },
    };
    setCurrentUser(googleUser);
    return googleUser;
  };

  const loginWithEmail = (data: { email: string; nomAffiche?: string; etablissement?: string }) => {
    const username = data.email.split('@')[0].replace(/[^\w]/g, '_');
    const customUser: Utilisateur = {
      id: `usr-custom-${Date.now()}`,
      username,
      nomAffiche: data.nomAffiche || data.email.split('@')[0],
      role: 'etudiant',
      email: data.email,
      etablissement: data.etablissement || 'Établissement Enregistré',
      badges: [{ id: 'b-compte', nom: 'Membre Vérifié', icone: '✅', description: 'Compte civique enregistré' }],
      stats: { contributions: 1, votes: 5, commentaires: 2 },
    };
    setCurrentUser(customUser);
    return customUser;
  };

  const logout = () => {
    setCurrentUser(MOCK_ANONYMOUS_USER);
  };

  return {
    user,
    isAuthenticated: user.role !== 'anonyme',
    isAnonymous: user.role === 'anonyme',
    isAdmin: user.role === 'administrateur' || user.role === 'moderateur',
    loginAsStudent,
    loginAsAdmin,
    loginAsAnonymous,
    loginWithGoogle,
    loginWithEmail,
    logout,
    /** Vérification fine des permissions — voir src/lib/permissions/. */
    can: (permission: Permission) => hasPermission(user, permission),
    canAny: (permissions: Permission[]) => hasAnyPermission(user, permissions),
    canOnResource: (baseAction: 'news:edit' | 'news:delete' | 'commentaire:delete', resourceOwnerId: string | undefined) =>
      canOnResource(user, baseAction, resourceOwnerId),
  };
}

