// ============================================================
// src/services/api/liens.service.ts
// Service Liens de publication — bascule automatique mock/réel
// selon `env.useMockData`.
// ============================================================

import { env } from '../../config/env';
import type { LienPublication } from '../../types/global.types';
import { INITIAL_LIENS as MOCK_LIENS } from './mocks/liens.mock';
import { liensRepository } from './repositories/liens.repository';
import type { LienEcriturePayload } from './repositories/liens.repository';

let liensMemory: LienPublication[] = env.useMockData ? [...MOCK_LIENS] : [];

export const liensService = {
  genererLien: async (newsId: string, payload: LienEcriturePayload): Promise<LienPublication> => {
    if (env.useMockData) {
      const randomHash = Math.random().toString(36).substring(2, 8);
      const newLien: LienPublication = {
        id: `lien-${Date.now()}`,
        newsId,
        sujetId: newsId,
        urlPublique: payload.urlPublique || `https://civitasnews.org/news?news=${newsId}`,
        urlCourte: `https://civit.as/${randomHash}`,
        visibilite: payload.visibilite,
        // Lecture = "un mot de passe existe-t-il ?", pas le mot de passe lui-même.
        motDePasse: Boolean(payload.motDePasse),
        expiration: payload.expiration,
        usageUnique: payload.usageUnique || false,
        scope: payload.scope,
        clics: 0,
        scans: 0,
        createdAt: new Date().toISOString(),
      };
      liensMemory = [newLien, ...liensMemory];
      return newLien;
    }

    const created = await liensRepository.generate(newsId, payload);
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
