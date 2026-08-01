import { Commentaire, TypeReaction } from '../types/global.types';
import { apiClient } from './api.client';

export const INITIAL_COMMENTS: Commentaire[] = [
  {
    id: 'comm-101',
    newsId: 'news-1',
    sujetId: 'news-1',
    auteur: {
      id: 'usr-admin-sec',
      username: 'secretariat_general',
      nomAffiche: 'Secrétariat Général Académique',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      role: 'administrateur',
      badges: [{ id: 'b-sec', nom: 'Officiel', icone: '🏛️', description: 'Compte Officiel' }],
      stats: { contributions: 120, votes: 300, commentaires: 450 },
    },
    contenu: "⚠️ **Note Officielle de la Commission Transports** : La première phase de consultation restera ouverte jusqu'au 31 août. Merci à tous les représentants des délégués de partager cette page au sein de leurs amphithéâtres.",
    reactions: { coeur: 45, jaime: 88, bravo: 62, youpi: 12, wow: 8, jaimepas: 0 },
    votes: 34,
    estEpingle: true,
    estReponseAcceptee: false,
    estAdministrateur: true,
    createdAt: '2026-07-16T09:00:00Z',
  },
  {
    id: 'comm-102',
    newsId: 'news-1',
    sujetId: 'news-1',
    auteur: {
      id: 'usr-student-99',
      username: 'jean_paul_m',
      nomAffiche: 'Jean-Paul Mukendi (Fac. Droit)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: 'etudiant',
      badges: [{ id: 'b-active', nom: 'Contributeur Actif', icone: '🔥', description: '+20 commentaires' }],
      stats: { contributions: 18, votes: 45, commentaires: 29 },
    },
    contenu: "Excellente initiative ! Mais qu'en est-il des étudiants vivant dans la périphérie Est ? La ligne 12 actuelle s'arrête à 18h30, ce qui empêche d'assister aux TP du soir.",
    reactions: { coeur: 12, jaime: 28, bravo: 5, youpi: 2, wow: 3, jaimepas: 0 },
    votes: 19,
    estEpingle: false,
    estReponseAcceptee: true,
    estAdministrateur: false,
    createdAt: '2026-07-16T11:20:00Z',
  },
  {
    id: 'comm-103',
    newsId: 'news-1',
    sujetId: 'news-1',
    reponseA: 'comm-102',
    auteur: {
      id: 'usr-org-01',
      username: 'mutuelle_nationale',
      nomAffiche: 'Confédération des Mutuelles Étudiantes',
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      role: 'organisation',
      badges: [],
      stats: { contributions: 45, votes: 120, commentaires: 88 },
    },
    contenu: "@jean_paul_m C'est exactement le point 2 de la négociation ! Nous avons proposé une extension jusqu'à 21h30 pour la ligne 12.",
    reactions: { coeur: 8, jaime: 15, bravo: 10, youpi: 4, wow: 1, jaimepas: 0 },
    votes: 14,
    estEpingle: false,
    estReponseAcceptee: false,
    estAdministrateur: false,
    createdAt: '2026-07-16T12:05:00Z',
  },
  {
    id: 'comm-104',
    newsId: 'news-1',
    sujetId: 'news-1',
    reponseA: 'comm-103',
    auteur: {
      id: 'usr-student-88',
      username: 'claire_mwamba',
      nomAffiche: 'Claire Mwamba (Déléguée L3)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'etudiant',
      badges: [{ id: 'b-rep', nom: 'Représentante', icone: '🎓', description: 'Déléguée Amphi' }],
      stats: { contributions: 32, votes: 95, commentaires: 41 },
    },
    contenu: "Merci pour la précision ! Est-ce que le tarif étudiant subventionné à 50% sera également garanti sur ces lignes tardives ?",
    reactions: { coeur: 10, jaime: 22, bravo: 4, youpi: 1, wow: 0, jaimepas: 0 },
    votes: 11,
    estEpingle: false,
    estReponseAcceptee: false,
    estAdministrateur: false,
    createdAt: '2026-07-16T13:15:00Z',
  },
  {
    id: 'comm-105',
    newsId: 'news-1',
    sujetId: 'news-1',
    reponseA: 'comm-104',
    auteur: {
      id: 'usr-org-01',
      username: 'mutuelle_nationale',
      nomAffiche: 'Confédération des Mutuelles Étudiantes',
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      role: 'organisation',
      badges: [],
      stats: { contributions: 45, votes: 120, commentaires: 88 },
    },
    contenu: "Oui absolument Claire ! Le ministère a confirmé que la carte étudiante restera valable sur toutes les navettes jusqu'à la fermeture.",
    reactions: { coeur: 18, jaime: 30, bravo: 12, youpi: 8, wow: 2, jaimepas: 0 },
    votes: 24,
    estEpingle: false,
    estReponseAcceptee: true,
    estAdministrateur: false,
    createdAt: '2026-07-16T14:00:00Z',
  },
  {
    id: 'comm-106',
    newsId: 'news-1',
    sujetId: 'news-1',
    reponseA: 'comm-102',
    auteur: {
      id: 'usr-student-77',
      username: 'patrick_k',
      nomAffiche: 'Patrick Kimbembe',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      role: 'etudiant',
      badges: [],
      stats: { contributions: 8, votes: 15, commentaires: 12 },
    },
    contenu: "Je confirme, la ligne 12 est toujours saturée vers 18h. Il faudrait au moins deux bus articulés supplémentaires.",
    reactions: { coeur: 4, jaime: 11, bravo: 2, youpi: 0, wow: 0, jaimepas: 0 },
    votes: 8,
    estEpingle: false,
    estReponseAcceptee: false,
    estAdministrateur: false,
    createdAt: '2026-07-16T15:10:00Z',
  },
  {
    id: 'comm-107',
    newsId: 'news-2',
    sujetId: 'news-2',
    auteur: {
      id: 'usr-student-99',
      username: 'jean_paul_m',
      nomAffiche: 'Jean-Paul Mukendi (Fac. Droit)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: 'etudiant',
      badges: [{ id: 'b-active', nom: 'Contributeur Actif', icone: '🔥', description: '+20 commentaires' }],
      stats: { contributions: 18, votes: 45, commentaires: 29 },
    },
    contenu: "Pour la numérisation des examens, une période de test d'au moins 6 mois est indispensable pour éviter les pannes techniques lors des épreuves.",
    reactions: { coeur: 15, jaime: 34, bravo: 11, youpi: 2, wow: 0, jaimepas: 0 },
    votes: 29,
    estEpingle: false,
    estReponseAcceptee: false,
    estAdministrateur: false,
    createdAt: '2026-07-17T08:30:00Z',
  },
  {
    id: 'comm-108',
    newsId: 'news-2',
    sujetId: 'news-2',
    reponseA: 'comm-107',
    auteur: {
      id: 'usr-admin-sec',
      username: 'secretariat_general',
      nomAffiche: 'Secrétariat Général Académique',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      role: 'administrateur',
      badges: [{ id: 'b-sec', nom: 'Officiel', icone: '🏛️', description: 'Compte Officiel' }],
      stats: { contributions: 120, votes: 300, commentaires: 450 },
    },
    contenu: "Nous avons prévu une session blanche (examen blanc de simulation) fin novembre pour tester toute l'infrastructure serveur et fibre optique.",
    reactions: { coeur: 22, jaime: 41, bravo: 19, youpi: 5, wow: 3, jaimepas: 0 },
    votes: 38,
    estEpingle: false,
    estReponseAcceptee: true,
    estAdministrateur: true,
    createdAt: '2026-07-17T09:15:00Z',
  },
  {
    id: 'comm-109',
    newsId: 'news-2',
    sujetId: 'news-2',
    reponseA: 'comm-108',
    auteur: {
      id: 'usr-student-88',
      username: 'claire_mwamba',
      nomAffiche: 'Claire Mwamba (Déléguée L3)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'etudiant',
      badges: [{ id: 'b-rep', nom: 'Représentante', icone: '🎓', description: 'Déléguée Amphi' }],
      stats: { contributions: 32, votes: 95, commentaires: 41 },
    },
    contenu: "Super nouvelle ! Pouvez-vous aussi nous confirmer si des ordinateurs seront fournis pour les étudiants n'ayant pas d'ordinateur portable ?",
    reactions: { coeur: 14, jaime: 28, bravo: 8, youpi: 2, wow: 1, jaimepas: 0 },
    votes: 19,
    estEpingle: false,
    estReponseAcceptee: false,
    estAdministrateur: false,
    createdAt: '2026-07-17T10:00:00Z',
  },
];

let commentsMemory: Commentaire[] = INITIAL_COMMENTS;

export const commentsService = {
  getCommentsByNews: async (newsId: string, tri: 'recents' | 'populaires' | 'pertinents' = 'recents'): Promise<Commentaire[]> => {
    let list = commentsMemory.filter((c) => c.newsId === newsId || c.sujetId === newsId);
    if (tri === 'populaires') {
      list = [...list].sort((a, b) => b.votes - a.votes);
    } else if (tri === 'pertinents') {
      list = [...list].sort((a, b) => (b.estEpingle || b.estReponseAcceptee ? 1 : 0) - (a.estEpingle || a.estReponseAcceptee ? 1 : 0));
    } else {
      list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  },

  getCommentsBySujet: async (sujetId: string, tri: 'recents' | 'populaires' | 'pertinents' = 'recents'): Promise<Commentaire[]> => {
    return commentsService.getCommentsByNews(sujetId, tri);
  },

  addComment: async (newsId: string, contenu: string, auteur: Commentaire['auteur'], reponseA?: string): Promise<Commentaire> => {
    const newComm: Commentaire = {
      id: `comm-${Date.now()}`,
      newsId,
      sujetId: newsId,
      auteur,
      contenu,
      reponseA,
      reactions: { coeur: 0, jaime: 0, bravo: 0, youpi: 0, wow: 0, jaimepas: 0 },
      votes: 1,
      userVoteStatus: 'up',
      estEpingle: false,
      estReponseAcceptee: false,
      estAdministrateur: auteur.role === 'administrateur' || auteur.role === 'moderateur',
      createdAt: new Date().toISOString(),
    };
    commentsMemory = [newComm, ...commentsMemory];
    return newComm;
  },

  voteComment: async (commentId: string, direction: 'up' | 'down'): Promise<Commentaire | null> => {
    commentsMemory = commentsMemory.map((c) => {
      if (c.id === commentId) {
        if (c.userVoteStatus === direction) {
          // remove vote
          return {
            ...c,
            votes: c.votes + (direction === 'up' ? -1 : 1),
            userVoteStatus: null,
          };
        } else {
          const delta = c.userVoteStatus ? (direction === 'up' ? 2 : -2) : (direction === 'up' ? 1 : -1);
          return {
            ...c,
            votes: c.votes + delta,
            userVoteStatus: direction,
          };
        }
      }
      return c;
    });
    return commentsMemory.find((c) => c.id === commentId) || null;
  },

  reactToComment: async (commentId: string, reaction: TypeReaction): Promise<Commentaire | null> => {
    commentsMemory = commentsMemory.map((c) => {
      if (c.id === commentId) {
        const count = c.reactions[reaction] || 0;
        return {
          ...c,
          reactions: { ...c.reactions, [reaction]: count + 1 },
        };
      }
      return c;
    });
    return commentsMemory.find((c) => c.id === commentId) || null;
  },

  togglePin: async (commentId: string): Promise<Commentaire | null> => {
    commentsMemory = commentsMemory.map((c) => (c.id === commentId ? { ...c, estEpingle: !c.estEpingle } : c));
    return commentsMemory.find((c) => c.id === commentId) || null;
  },
};

/**
 * Operational Backend API Service for Comments (real HTTP requests)
 */
export const commentsBackendService = {
  getCommentsByNews: async (newsId: string, tri: 'recents' | 'populaires' | 'pertinents' = 'recents'): Promise<Commentaire[]> => {
    return apiClient.get<Commentaire[]>(`/news/${newsId}/commentaires?tri=${tri}`);
  },

  getCommentsBySujet: async (sujetId: string, tri: 'recents' | 'populaires' | 'pertinents' = 'recents'): Promise<Commentaire[]> => {
    return apiClient.get<Commentaire[]>(`/news/${sujetId}/commentaires?tri=${tri}`);
  },

  addComment: async (newsId: string, contenu: string, reponseA?: string): Promise<Commentaire> => {
    return apiClient.post<Commentaire>(`/news/${newsId}/commentaires`, { contenu, reponseA });
  },

  voteComment: async (commentId: string, direction: 'up' | 'down'): Promise<Commentaire> => {
    return apiClient.post<Commentaire>(`/commentaires/${commentId}/vote`, { direction });
  },

  reactToComment: async (commentId: string, reaction: TypeReaction): Promise<Commentaire> => {
    return apiClient.post<Commentaire>(`/commentaires/${commentId}/reactions`, { reaction });
  },

  togglePin: async (commentId: string): Promise<Commentaire> => {
    return apiClient.post<Commentaire>(`/commentaires/${commentId}/pin`, {});
  },
};

