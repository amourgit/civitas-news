// ============================================================
// src/services/api/mocks/auth.mock.ts
// Utilisateurs de démonstration — déplacés depuis
// src/store/auth.store.ts pour séparer données et état.
//
// Rappel : le backend actuel (Backend-Core-Base) n'a pas encore
// d'endpoint d'inscription publique et son modèle User n'a pas les
// champs enrichis (avatar, role, badges, stats). Ce mode mock reste
// donc le mode par défaut tant que ce travail backend n'est pas fait.
// ============================================================

import type { Utilisateur } from '../../../types/global.types';

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
  badges: [{ id: 'ba', nom: 'Modérateur Officiel', icone: '🛡️', description: 'Garant du débat démocratique' }],
  stats: { contributions: 120, votes: 150, commentaires: 310 },
};
