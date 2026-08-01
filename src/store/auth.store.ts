import { useState, useEffect } from 'react';
import { Utilisateur } from '../types/global.types';

export const MOCK_ANONYMOUS_USER: Utilisateur = {
  id: 'anon-user-001',
  username: 'anonyme_citoyen',
  nomAffiche: 'Citoyen Anonyme',
  role: 'anonyme',
  badges: [],
  stats: { contributions: 2, votes: 12, commentaires: 5 },
};

export const MOCK_STUDENT_USER: Utilisateur = {
  id: 'usr-student-789',
  username: 'amina_k',
  nomAffiche: 'Amina K. (Étudiante)',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'etudiant',
  email: 'amina.k@univ-central.edu',
  etablissement: 'Université Centrale de Kinshasa',
  badges: [
    { id: 'b1', nom: 'Pionnière', icone: '🌟', description: 'Membre fondatrice CIVITAS' },
    { id: 'b2', nom: 'Débatteuse', icone: '💬', description: '+50 commentaires pertinents' },
  ],
  stats: { contributions: 14, votes: 38, commentaires: 42 },
};

export const MOCK_ADMIN_USER: Utilisateur = {
  id: 'usr-admin-001',
  username: 'super_admin',
  nomAffiche: 'Administrateur CIVITAS',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  role: 'administrateur',
  email: 'admin@civitasnews.org',
  etablissement: 'Secrétariat Général Académique',
  badges: [
    { id: 'ba', nom: 'Modérateur Officiel', icone: '🛡️', description: 'Garant du débat démocratique' },
  ],
  stats: { contributions: 120, votes: 150, commentaires: 310 },
};

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
  };
}

