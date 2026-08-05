// ============================================================
// src/services/api/liens.service.ts
// Service Liens de publication — bascule automatique mock/réel
// selon `env.useMockData`.
// ============================================================

import { env } from '../../config/env';
import type { LienPublication } from '../../types/global.types';
import { INITIAL_LIENS as MOCK_LIENS } from './mocks/liens.mock';
import { liensRepository } from './repositories/liens.repository';

let liensMemory: LienPublication[] = env.useMockData ? [...MOCK_LIENS] : [];

export const liensService = {
  genererLien: async (newsId: string, options: Partial<LienPublication>): Promise<LienPublication> => {
    if (env.useMockData) {
      const randomHash = Math.random().toString(36).substring(2, 8);
      const newLien: LienPublication = {
        id: `lien-${Date.now()}`,
        newsId,
        sujetId: newsId,
        urlPublique: options.urlPublique || `https://civitasnews.org/news/${newsId}`,
        urlCourte: `https://civit.as/${randomHash}`,
        visibilite: options.visibilite || 'public',
        motDePasse: options.motDePasse || false,
        expiration: options.expiration,
        usageUnique: options.usageUnique || false,
        scope: options.scope,
        clics: 0,
        scans: 0,
        createdAt: new Date().toISOString(),
      };
      liensMemory = [newLien, ...liensMemory];
      return newLien;
    }

    const created = await liensRepository.generate(newsId, options);
    liensMemory = [created, ...liensMemory];
    return created;
  },

  getLiensByNews: async (newsId: string): Promise<LienPublication[]> => {
    if (env.useMockData) {
      return liensMemory.filter((l) => l.newsId === newsId || l.sujetId === newsId);
    }
    const list = await liensRepository.listByNews(newsId);
    liensMemory = [...liensMemory.filter((l) => l.newsId !== newsId), ...list];
    return list;
  },

  getLiensBySujet: async (sujetId: string): Promise<LienPublication[]> => {
    return liensService.getLiensByNews(sujetId);
  },
};
