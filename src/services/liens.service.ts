import { LienPublication } from '../types/global.types';

let liensMemory: LienPublication[] = [
  {
    id: 'lien-001',
    newsId: 'news-1',
    sujetId: 'news-1',
    urlPublique: 'https://civitasnews.org/news/reforme-transport-etudiant-2026',
    urlCourte: 'https://civit.as/tr-2026',
    visibilite: 'public',
    clics: 1420,
    scans: 380,
    createdAt: '2026-07-15T10:30:00Z',
  },
];

export const liensService = {
  genererLien: async (newsId: string, options: Partial<LienPublication>): Promise<LienPublication> => {
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
  },

  getLiensByNews: async (newsId: string): Promise<LienPublication[]> => {
    return liensMemory.filter((l) => l.newsId === newsId || l.sujetId === newsId);
  },

  getLiensBySujet: async (sujetId: string): Promise<LienPublication[]> => {
    return liensService.getLiensByNews(sujetId);
  },
};
