// ============================================================
// src/services/api/repositories/liens.repository.ts
// Implémentation RÉELLE du domaine Liens de publication.
// ============================================================

import { z } from 'zod';
import { http } from './httpClient';
import { LIENS_ENDPOINTS } from '../endpoints';
import { LienPublicationSchema, type LienPublication } from '../../../types/global.types';

export const liensRepository = {
  async listByNews(newsId: string): Promise<LienPublication[]> {
    const response = await http.get.get<LienPublication[]>({
      endpoint: LIENS_ENDPOINTS.byNews(newsId),
      schema: z.array(LienPublicationSchema),
      requireAuth: false,
    });
    return response.data;
  },

  async generate(newsId: string, options: Partial<LienPublication>): Promise<LienPublication> {
    const response = await http.post.post<Partial<LienPublication>, LienPublication>({
      endpoint: LIENS_ENDPOINTS.create(newsId),
      body: options,
      responseSchema: LienPublicationSchema,
      requireAuth: true,
    });
    return response.data;
  },
};
