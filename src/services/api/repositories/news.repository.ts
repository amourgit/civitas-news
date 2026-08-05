// ============================================================
// src/services/api/repositories/news.repository.ts
// Implémentation RÉELLE et complète du domaine News, construite
// à 100% sur le socle services/api/ (Get/Post/Update/DeleteService).
//
// Utilisée dès que env.useMockData === false (voir src/config/env.ts).
// Le backend n'expose pas encore ces routes (voir endpoints.ts) —
// ce repository est prêt à fonctionner dès qu'elles existeront,
// sans qu'aucun composant n'ait à changer.
// ============================================================

import { http } from './httpClient';
import { NEWS_ENDPOINTS } from '../endpoints';
import { NewsSchema, type News, type NewsType, type TypeReaction } from '../../../types/global.types';
import { paginatedSchema, fetchAllPages } from '../utils/pagination';

export interface NewsQueryParams {
  category?: string;
  type?: NewsType;
  search?: string;
  province?: string;
}

export const newsRepository = {
  async list(params?: NewsQueryParams): Promise<News[]> {
    return fetchAllPages<News>(async (page) => {
      const response = await http.get.get({
        endpoint: NEWS_ENDPOINTS.list,
        params: { ...(params as Record<string, unknown> | undefined), page },
        schema: paginatedSchema(NewsSchema),
        requireAuth: false,
      });
      return { results: response.data.results, next: response.data.next };
    });
  },

  async getBySlug(slugOrId: string): Promise<News | null> {
    try {
      const response = await http.get.get<News>({
        endpoint: NEWS_ENDPOINTS.detail(slugOrId),
        schema: NewsSchema,
        requireAuth: false,
      });
      return response.data;
    } catch {
      return null;
    }
  },

  async react(newsId: string, reactionType: TypeReaction): Promise<News> {
    const response = await http.post.post<{ reaction: TypeReaction }, News>({
      endpoint: NEWS_ENDPOINTS.react(newsId),
      body: { reaction: reactionType },
      responseSchema: NewsSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async create(data: Partial<News>): Promise<News> {
    const response = await http.post.post<Partial<News>, News>({
      endpoint: NEWS_ENDPOINTS.list,
      body: data,
      responseSchema: NewsSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async update(id: string, data: Partial<News>): Promise<News> {
    const response = await http.update.patch<Partial<News>, News>({
      endpoint: NEWS_ENDPOINTS.list,
      resourceId: id,
      patches: data,
      responseSchema: NewsSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await http.delete.delete({
      endpoint: NEWS_ENDPOINTS.list,
      resourceId: id,
      requireAuth: true,
    });
  },
};
