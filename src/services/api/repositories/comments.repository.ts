// ============================================================
// src/services/api/repositories/comments.repository.ts
// Implémentation RÉELLE et complète du domaine Commentaires.
// ============================================================

import { z } from 'zod';
import { http } from './httpClient';
import { COMMENTS_ENDPOINTS } from '../endpoints';
import { CommentaireSchema, type Commentaire } from '../../../types/global.types';

export interface CreerCommentairePayload {
  contenu: string;
  typeContenu?: 'texte' | 'audio';
  audioUrl?: string;
  audioDuration?: number;
  reponseA?: string;
  mentions?: string[];
}

export const commentsRepository = {
  async listByNews(newsId: string): Promise<Commentaire[]> {
    const response = await http.get.get<Commentaire[]>({
      endpoint: COMMENTS_ENDPOINTS.byNews(newsId),
      schema: z.array(CommentaireSchema),
      requireAuth: false,
    });
    return response.data;
  },

  async create(newsId: string, payload: CreerCommentairePayload): Promise<Commentaire> {
    const response = await http.post.post<CreerCommentairePayload, Commentaire>({
      endpoint: COMMENTS_ENDPOINTS.byNews(newsId),
      body: payload,
      responseSchema: CommentaireSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async vote(commentId: string, direction: 'up' | 'down'): Promise<Commentaire> {
    const response = await http.post.post<{ direction: 'up' | 'down' }, Commentaire>({
      endpoint: COMMENTS_ENDPOINTS.vote(commentId),
      body: { direction },
      responseSchema: CommentaireSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async react(commentId: string, reaction: string): Promise<Commentaire> {
    const response = await http.post.post<{ reaction: string }, Commentaire>({
      endpoint: COMMENTS_ENDPOINTS.react(commentId),
      body: { reaction },
      responseSchema: CommentaireSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async pin(commentId: string, epingle: boolean): Promise<Commentaire> {
    const response = await http.post.post<{ estEpingle: boolean }, Commentaire>({
      endpoint: COMMENTS_ENDPOINTS.pin(commentId),
      body: { estEpingle: epingle },
      responseSchema: CommentaireSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async remove(commentId: string): Promise<void> {
    await http.delete.delete({
      endpoint: COMMENTS_ENDPOINTS.detail(commentId),
      requireAuth: true,
    });
  },
};
