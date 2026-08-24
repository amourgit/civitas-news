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

  /** Table du backoffice — tous les commentaires, non filtrés par News. */
  async list(): Promise<Commentaire[]> {
    return fetchAllPages<Commentaire>(async (page) => {
      const response = await http.get.get({
        endpoint: COMMENTS_ENDPOINTS.list,
        params: { page },
        schema: paginatedSchema(CommentaireSchema),
        requireAuth: false,
      });
      return { results: response.data.results, next: response.data.next };
    });
  },

  async getById(id: string): Promise<Commentaire> {
    // CommentaireViewSet.retrieve() est explicitement surchargé côté
    // backend pour toujours répondre avec CommentaireSerializer (la
    // forme complète — auteur, réactions, votes...), jamais la forme
    // d'écriture. Contrairement au PATCH ci-dessous, ce GET est donc
    // directement validable contre CommentaireSchema.
    const response = await http.get.get<Commentaire>({
      endpoint: COMMENTS_ENDPOINTS.detail(id),
      schema: CommentaireSchema,
      requireAuth: false,
    });
    return response.data;
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

  /**
   * Le PATCH renvoie la forme d'ÉCRITURE (CommentaireEcritureSerializer :
   * seulement id/contenu/typeContenu/audioDuration/reponseA — voir
   * commentaires/api/v1/views.py), pas la forme complète attendue par
   * CommentaireSchema (auteur/reactions/votes obligatoires) : valider la
   * réponse du PATCH ferait donc systématiquement échouer Zod. On
   * n'attache donc PAS de `responseSchema` ici, et on rapatrie la forme
   * complète et à jour via un second appel `getById`.
   */
  async update(id: string, payload: Partial<CreerCommentairePayload>): Promise<Commentaire> {
    await http.update.patch<Partial<CreerCommentairePayload>, unknown>({
      endpoint: COMMENTS_ENDPOINTS.list,
      resourceId: id,
      patches: payload,
      requireAuth: true,
    });
    return commentsRepository.getById(id);
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
