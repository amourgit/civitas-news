// ============================================================
// src/services/comments.service.ts
// Service Commentaires — bascule automatique mock/réel selon
// `env.useMockData` (voir src/config/env.ts). Mêmes exports et
// signatures qu'avant : aucun changement requis côté vues.
// ============================================================

import { env } from '../config/env';
import type { Commentaire, TypeReaction } from '../types/global.types';
import { INITIAL_COMMENTS as MOCK_COMMENTS } from './api/mocks/comments.mock';
import { commentsRepository } from './api/repositories/comments.repository';

/** Conservé pour compatibilité ascendante. */
export const INITIAL_COMMENTS: Commentaire[] = MOCK_COMMENTS;

let commentsMemory: Commentaire[] = env.useMockData ? [...MOCK_COMMENTS] : [];

function sortComments(list: Commentaire[], tri: 'recents' | 'populaires' | 'pertinents'): Commentaire[] {
  if (tri === 'populaires') {
    return [...list].sort((a, b) => b.votes - a.votes);
  }
  if (tri === 'pertinents') {
    return [...list].sort((a, b) => (b.estEpingle || b.estReponseAcceptee ? 1 : 0) - (a.estEpingle || a.estReponseAcceptee ? 1 : 0));
  }
  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export const commentsService = {
  getCommentsByNews: async (
    newsId: string,
    tri: 'recents' | 'populaires' | 'pertinents' = 'recents'
  ): Promise<Commentaire[]> => {
    if (env.useMockData) {
      const list = commentsMemory.filter((c) => c.newsId === newsId || c.sujetId === newsId);
      return sortComments(list, tri);
    }
    const list = await commentsRepository.listByNews(newsId);
    commentsMemory = [...commentsMemory.filter((c) => c.newsId !== newsId), ...list];
    return sortComments(list, tri);
  },

  getCommentsBySujet: async (
    sujetId: string,
    tri: 'recents' | 'populaires' | 'pertinents' = 'recents'
  ): Promise<Commentaire[]> => {
    return commentsService.getCommentsByNews(sujetId, tri);
  },

  addComment: async (
    newsId: string,
    contenu: string,
    auteur: Commentaire['auteur'],
    reponseA?: string
  ): Promise<Commentaire> => {
    const isAudio = contenu.startsWith('🎙️ Message vocal');
    let audioDuration = 15;
    if (isAudio) {
      const match = contenu.match(/\((\d{2}):(\d{2})\)/);
      if (match) {
        audioDuration = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
      }
    }

    if (env.useMockData) {
      const newComm: Commentaire = {
        id: `comm-${Date.now()}`,
        newsId,
        sujetId: newsId,
        auteur,
        typeContenu: isAudio ? 'audio' : 'texte',
        audioDuration: isAudio ? audioDuration : undefined,
        contenu,
        reponseA,
        reactions: {},
        userReactions: [],
        votes: 1,
        userVoteStatus: 'up',
        estEpingle: false,
        estReponseAcceptee: false,
        estAdministrateur: auteur.role === 'administrateur' || auteur.role === 'moderateur',
        createdAt: new Date().toISOString(),
      };
      commentsMemory = [newComm, ...commentsMemory];
      return newComm;
    }

    // Note : en mode réel, l'auteur est déterminé côté backend à partir du
    // token JWT — le paramètre `auteur` n'est conservé ici que pour la
    // compatibilité de signature avec le mode mock.
    const created = await commentsRepository.create(newsId, {
      contenu,
      typeContenu: isAudio ? 'audio' : 'texte',
      audioDuration: isAudio ? audioDuration : undefined,
      reponseA,
    });
    commentsMemory = [created, ...commentsMemory];
    return created;
  },

  voteComment: async (commentId: string, direction: 'up' | 'down'): Promise<Commentaire | null> => {
    if (env.useMockData) {
      commentsMemory = commentsMemory.map((c) => {
        if (c.id === commentId) {
          if (c.userVoteStatus === direction) {
            return { ...c, votes: c.votes + (direction === 'up' ? -1 : 1), userVoteStatus: null };
          }
          const delta = c.userVoteStatus ? (direction === 'up' ? 2 : -2) : direction === 'up' ? 1 : -1;
          return { ...c, votes: c.votes + delta, userVoteStatus: direction };
        }
        return c;
      });
      return commentsMemory.find((c) => c.id === commentId) || null;
    }

    const updated = await commentsRepository.vote(commentId, direction);
    commentsMemory = commentsMemory.map((c) => (c.id === commentId ? updated : c));
    return updated;
  },

  reactToComment: async (commentId: string, reaction: TypeReaction | string): Promise<Commentaire | null> => {
    if (env.useMockData) {
      commentsMemory = commentsMemory.map((c) => {
        if (c.id === commentId) {
          const reactionsMap = { ...(c.reactions || {}) };
          const userReactions = [...(c.userReactions || [])];
          const index = userReactions.indexOf(reaction);

          if (index > -1) {
            userReactions.splice(index, 1);
            reactionsMap[reaction] = Math.max(0, (reactionsMap[reaction] || 1) - 1);
            if (reactionsMap[reaction] <= 0) delete reactionsMap[reaction];
          } else {
            userReactions.push(reaction);
            reactionsMap[reaction] = (reactionsMap[reaction] || 0) + 1;
          }

          return { ...c, reactions: reactionsMap, userReactions };
        }
        return c;
      });
      return commentsMemory.find((c) => c.id === commentId) || null;
    }

    const updated = await commentsRepository.react(commentId, reaction);
    commentsMemory = commentsMemory.map((c) => (c.id === commentId ? updated : c));
    return updated;
  },

  togglePin: async (commentId: string): Promise<Commentaire | null> => {
    if (env.useMockData) {
      commentsMemory = commentsMemory.map((c) => (c.id === commentId ? { ...c, estEpingle: !c.estEpingle } : c));
      return commentsMemory.find((c) => c.id === commentId) || null;
    }

    const current = commentsMemory.find((c) => c.id === commentId);
    const updated = await commentsRepository.pin(commentId, !(current?.estEpingle ?? false));
    commentsMemory = commentsMemory.map((c) => (c.id === commentId ? updated : c));
    return updated;
  },
};

/**
 * Alias explicites vers le repository réel (voir news.service.ts pour la
 * même convention).
 */
export const commentsBackendService = {
  getCommentsByNews: (newsId: string) => commentsRepository.listByNews(newsId),
  getCommentsBySujet: (sujetId: string) => commentsRepository.listByNews(sujetId),
  addComment: (newsId: string, contenu: string, reponseA?: string) =>
    commentsRepository.create(newsId, { contenu, reponseA }),
  voteComment: (commentId: string, direction: 'up' | 'down') => commentsRepository.vote(commentId, direction),
  reactToComment: (commentId: string, reaction: string) => commentsRepository.react(commentId, reaction),
  togglePin: (commentId: string, epingle: boolean) => commentsRepository.pin(commentId, epingle),
};
