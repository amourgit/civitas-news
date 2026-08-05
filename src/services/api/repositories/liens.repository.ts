// ============================================================
// src/services/api/repositories/liens.repository.ts
// Implémentation RÉELLE du domaine Liens de publication.
// ============================================================

import { http } from './httpClient';
import { LIENS_ENDPOINTS } from '../endpoints';
import { LienPublicationSchema, type LienPublication } from '../../../types/global.types';
import { paginatedSchema, fetchAllPages } from '../utils/pagination';

export const liensRepository = {
  async listByNews(newsId: string): Promise<LienPublication[]> {
    return fetchAllPages<LienPublication>(async (page) => {
      const response = await http.get.get({
        endpoint: LIENS_ENDPOINTS.create,
        params: { news: newsId, page },
        schema: paginatedSchema(LienPublicationSchema),
        requireAuth: false,
      });
      return { results: response.data.results, next: response.data.next };
    });
  },

  async generate(newsId: string, options: Partial<LienPublication>): Promise<LienPublication> {
    const response = await http.post.post<Partial<LienPublication> & { news: string }, LienPublication>({
      endpoint: LIENS_ENDPOINTS.create,
      // `news` est requis par liens/api/v1/serializers.py
      // (LienPublicationEcritureSerializer) — l'URL n'étant plus
      // imbriquée sous /news/{id}/, l'id doit voyager dans le corps.
      body: { ...options, news: newsId },
      responseSchema: LienPublicationSchema,
      requireAuth: true,
    });
    return response.data;
  },
};
