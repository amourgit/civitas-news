// ============================================================
// src/services/api/repositories/comments.repository.ts
// Implémentation RÉELLE et complète du domaine Commentaires.
// ============================================================

import { http } from './httpClient';
import { COMMENTS_ENDPOINTS } from '../endpoints';
import { CommentaireSchema, type Commentaire } from '../../../types/global.types';
import { paginatedSchema, fetchAllPages } from '../utils/pagination';

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
    return fetchAllPages<Commentaire>(async (page) => {
      const response = await http.get.get({
        endpoint: COMMENTS_ENDPOINTS.list,
        params: { news: newsId, page },
        schema: paginatedSchema(CommentaireSchema),
        requireAuth: false,
      });
      return { results: response.data.results, next: response.data.next };
    });
  },

  async create(newsId: string, payload: CreerCommentairePayload): Promise<Commentaire> {
    const response = await http.post.post<CreerCommentairePayload & { news: string }, Commentaire>({
      endpoint: COMMENTS_ENDPOINTS.list,
      // `news` est requis par commentaires/api/v1/views.py (perform_create) —
      // l'URL n'étant plus imbriquée sous /news/{id}/, l'id doit voyager
      // dans le corps de la requête.
      body: { ...payload, news: newsId },
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
