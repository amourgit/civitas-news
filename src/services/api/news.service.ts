// ============================================================
// src/services/api/news.service.ts
// Service News/Sujets — bascule automatiquement entre données mock
// et backend réel selon `env.useMockData` (voir src/config/env.ts) :
//   - useMockData = true  -> données locales (services/api/mocks/)
//   - useMockData = false -> vrais appels HTTP via
//                            services/api/repositories/news.repository.ts
//
// Vit désormais sous services/api/ (avec repositories/, mocks/,
// endpoints.ts) : plus aucune donnée applicative en dehors de ce dossier.
// ============================================================

import { env } from '../../config/env';
import type { News, NewsType, TypeReaction } from '../../types/global.types';
import { INITIAL_NEWS as MOCK_NEWS } from './mocks/news.mock';
import { newsRepository } from './repositories/news.repository';
import type { NewsQueryParams } from './repositories/news.repository';

/** Conservé pour compatibilité ascendante (tests, composants statistiques). */
export const INITIAL_NEWS: News[] = MOCK_NEWS;
export const INITIAL_SUJETS = INITIAL_NEWS;

/**
 * Cache mémoire local :
 *  - en mode mock, il EST la base de données (mutée directement) ;
 *  - en mode réel, il ne fait que refléter le dernier résultat connu,
 *    pour permettre `getNewsSync()` (lecture synchrone utilisée par
 *    certains widgets) sans effectuer de round-trip réseau.
 */
let newsMemory: News[] = env.useMockData ? [...MOCK_NEWS] : [];

function applyFilters(list: News[], params?: NewsQueryParams): News[] {
  let result = [...list];
  if (params?.type) {
    result = result.filter((s) => s.type === params.type);
  }
  if (params?.category && params.category !== 'all') {
    result = result.filter(
      (s) => s.categorie.id === params.category || s.categorie.nom.toLowerCase().includes(params.category!.toLowerCase())
    );
  }
  if (params?.province && params.province !== 'all') {
    result = result.filter((s) => s.province === params.province);
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    result = result.filter(
      (s) =>
        s.titre.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  return result;
}

export const newsService = {
  getNews: async (params?: NewsQueryParams): Promise<News[]> => {
    if (env.useMockData) {
      return applyFilters(newsMemory, params);
    }
    const data = await newsRepository.list(params);
    newsMemory = data;
    return data;
  },

  /** Lecture synchrone de la dernière liste connue (widgets qui ne peuvent pas attendre une promesse). */
  getNewsSync: (): News[] => {
    return newsMemory;
  },

  getNewsList: async (params?: NewsQueryParams): Promise<News[]> => {
    return newsService.getNews(params);
  },

  getSujets: async (params?: NewsQueryParams): Promise<News[]> => {
    return newsService.getNews(params);
  },

  getNewsBySlug: async (slug: string): Promise<News | null> => {
    if (env.useMockData) {
      return newsMemory.find((s) => s.slug === slug || s.id === slug) || null;
    }
    const found = await newsRepository.getBySlug(slug);
    if (found) {
      newsMemory = newsMemory.some((n) => n.id === found.id)
        ? newsMemory.map((n) => (n.id === found.id ? found : n))
        : [found, ...newsMemory];
    }
    return found;
  },

  getSujetBySlug: async (slug: string): Promise<News | null> => {
    return newsService.getNewsBySlug(slug);
  },

  reactToNews: async (newsId: string, reactionType: TypeReaction): Promise<News> => {
    if (env.useMockData) {
      newsMemory = newsMemory.map((s) => {
        if (s.id === newsId || s.slug === newsId) {
          const currentReaction = s.userReaction;
          const newReactions = { ...s.stats.reactions };

          if (currentReaction === reactionType) {
            // toggle off
            newReactions[reactionType] = Math.max(0, newReactions[reactionType] - 1);
            return {
              ...s,
              userReaction: null,
              stats: { ...s.stats, reactions: newReactions },
            };
          } else {
            // change or add
            if (currentReaction) {
              newReactions[currentReaction] = Math.max(0, newReactions[currentReaction] - 1);
            }
            newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
            return {
              ...s,
              userReaction: reactionType,
              stats: { ...s.stats, reactions: newReactions },
            };
          }
        }
        return s;
      });
      return (await newsService.getNewsBySlug(newsId)) || newsMemory[0];
    }

    const updated = await newsRepository.react(newsId, reactionType);
    newsMemory = newsMemory.map((n) => (n.id === updated.id ? updated : n));
    return updated;
  },

  incrementHeart: async (newsId: string, count: number = 1): Promise<News> => {
    if (env.useMockData) {
      newsMemory = newsMemory.map((s) => {
        if (s.id === newsId || s.slug === newsId) {
          const newReactions = { ...s.stats.reactions };
          newReactions.coeur = (newReactions.coeur || 0) + count;
          return {
            ...s,
            userReaction: 'coeur',
            stats: { ...s.stats, reactions: newReactions },
          };
        }
        return s;
      });
      return (await newsService.getNewsBySlug(newsId)) || newsMemory[0];
    }

    // Pas d'endpoint dédié côté backend pour un incrément multiple : on
    // retombe sur la réaction standard (idempotente côté serveur).
    return newsService.reactToNews(newsId, 'coeur');
  },

  reactToSujet: async (sujetId: string, reactionType: TypeReaction): Promise<News> => {
    return newsService.reactToNews(sujetId, reactionType);
  },

  createNews: async (newNewsData: Partial<News>): Promise<News> => {
    if (env.useMockData) {
      const slug =
        newNewsData.slug || (newNewsData.titre ? newNewsData.titre.toLowerCase().replace(/[^\w-]+/g, '-') : `news-${Date.now()}`);
      const created: News = {
        id: `news-${Date.now()}`,
        slug,
        type: newNewsData.type || 'consultation',
        titre: newNewsData.titre || 'Sans titre',
        description: newNewsData.description || '',
        contenu: newNewsData.contenu || '',
        image: newNewsData.image || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
        auteur: newNewsData.auteur || {
          id: 'usr-student-789',
          username: 'amina_k',
          nomAffiche: 'Amina K.',
          role: 'etudiant',
          badges: [],
          stats: { contributions: 1, votes: 0, commentaires: 0 },
        },
        categorie: newNewsData.categorie || { id: 'cat-general', nom: 'Vie Académique', couleur: '#5B4DFF', icone: 'BookOpen' },
        tags: newNewsData.tags || ['Nouveau', 'Civitas'],
        province: newNewsData.province || 'Estuaire',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statut: 'publie',
        visibilite: newNewsData.visibilite || 'public',
        stats: { vues: 1, commentaires: 0, reactions: { coeur: 0, jaime: 0, bravo: 0, youpi: 0, wow: 0, jaimepas: 0 }, votes: 0, partages: 0 },
        sondages: newNewsData.sondages || [],
        documents: newNewsData.documents || [],
      };
      newsMemory = [created, ...newsMemory];
      return created;
    }

    const created = await newsRepository.create(newNewsData);
    newsMemory = [created, ...newsMemory];
    return created;
  },

  createSujet: async (newSujetData: Partial<News>): Promise<News> => {
    return newsService.createNews(newSujetData);
  },
};

export const sujetsService = newsService;

/**
 * Alias explicites vers le repository réel — utile quand un appelant a
 * besoin de forcer un appel backend indépendamment du mode mock/réel
 * courant (cas rare, ex. panneau de diagnostic admin).
 */
export const newsBackendService = {
  getNews: (params?: NewsQueryParams) => newsRepository.list(params),
  getNewsBySlug: (slug: string) => newsRepository.getBySlug(slug),
  reactToNews: (newsId: string, reactionType: TypeReaction) => newsRepository.react(newsId, reactionType),
  createNews: (data: Partial<News>) => newsRepository.create(data),
};

export const sujetsBackendService = newsBackendService;

// Export de compatibilité (certains appelants importaient le type directement)
export type { NewsType };
