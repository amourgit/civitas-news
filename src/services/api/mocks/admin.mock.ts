// ============================================================
// src/services/api/mocks/admin.mock.ts
// Données factices du domaine Administration/Modération.
// ============================================================

import type { Signalement, AuditLog, Utilisateur } from '../../../types/global.types';

export const INITIAL_SIGNALEMENTS: Signalement[] = [
  {
    id: 'sig-1',
    typeContenu: 'commentaire',
    contenuId: 'comm-88',
    titreOuApercu: "Propos déplacés concernant le coût de l'inscription...",
    motif: 'propos_inappropries',
    auteurSignalement: {
      id: 'usr-sig-1',
      username: 'etudiant_vigilant',
      nomAffiche: 'Marc L.',
      role: 'etudiant',
      badges: [],
      stats: { contributions: 5, votes: 12, commentaires: 4 },
    },
    statut: 'en_attente',
    createdAt: '2026-07-29T14:30:00Z',
  },
  {
    id: 'sig-2',
    typeContenu: 'news',
    contenuId: 'news-fake-01',
    titreOuApercu: 'Annonce suspecte pour un faux stage de recherche rémunéré',
    motif: 'spam',
    auteurSignalement: {
      id: 'usr-sig-2',
      username: 'caroline_p',
      nomAffiche: 'Caroline P.',
      role: 'etudiant',
      badges: [],
      stats: { contributions: 2, votes: 8, commentaires: 1 },
    },
    statut: 'en_attente',
    createdAt: '2026-07-30T10:15:00Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-1',
    action: 'Publication de News',
    utilisateur: 'Amina K.',
    cible: 'Plan Transport 2026',
    horodatage: '2026-07-30T14:20:00Z',
    adresseIp: '197.234.12.89',
  },
  {
    id: 'audit-2',
    action: 'Épinglage Commentaire',
    utilisateur: 'Secrétariat Général',
    cible: 'Note de cadrage',
    horodatage: '2026-07-29T09:00:00Z',
    adresseIp: '197.234.10.12',
  },
];

export const INITIAL_ADMIN_UTILISATEURS: Utilisateur[] = [
  {
    id: 'usr-1',
    username: 'amina_k',
    nomAffiche: 'Amina K.',
    email: 'amina.k@univ.edu',
    role: 'etudiant',
    etablissement: 'Université Centrale',
    badges: [{ id: 'b1', nom: 'Pionnière', icone: '🌟', description: 'Membre fondatrice' }],
    stats: { contributions: 14, votes: 38, commentaires: 42 },
  },
  {
    id: 'usr-2',
    username: 'prof_moussa',
    nomAffiche: 'Prof. Moussa Diop',
    email: 'moussa.diop@polytech.edu',
    role: 'administrateur',
    etablissement: 'Faculté Polytechnique',
    badges: [{ id: 'b2', nom: 'Doyen', icone: '🎓', description: 'Responsable' }],
    stats: { contributions: 68, votes: 95, commentaires: 150 },
  },
];
