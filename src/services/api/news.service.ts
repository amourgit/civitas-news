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
import type { News, NewsType, TypeReaction, Categorie, Organisation, Etablissement, Utilisateur } from '../../types/global.types';
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

/** Sentinelle UI pour "aucun filtre sur ce champ" (valeur des puces "Tous/Toutes") — voir news.repository.ts. */
const ALL_SENTINEL = 'all';

/** Reproduit en mémoire (mode mock) exactement les mêmes champs filtrables que le backend réel (voir news.repository.ts: NewsQueryParams / buildWireParams), pour un comportement identique en dev (mock) et en prod (API réelle). */
function applyFilters(list: News[], params?: NewsQueryParams): News[] {
  let result = [...list];
  if (params?.type) {
    result = result.filter((s) => s.type === params.type);
  }
  if (params?.categorieId && params.categorieId !== ALL_SENTINEL) {
    result = result.filter((s) => s.categorie.id === params.categorieId);
  }
  if (params?.organisationId && params.organisationId !== ALL_SENTINEL) {
    result = result.filter((s) => s.organisation?.id === params.organisationId);
  }
  if (params?.etablissementId && params.etablissementId !== ALL_SENTINEL) {
    result = result.filter((s) => s.etablissement?.id === params.etablissementId);
  }
  if (params?.province && params.province !== ALL_SENTINEL) {
    result = result.filter((s) => s.province === params.province);
  }
  if (params?.auteur) {
    result = result.filter((s) => s.auteur.id === params.auteur);
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

/**
 * Entrée du formulaire de création — volontairement dans la forme de
 * LECTURE (`categorie`/`organisation` en objets complets, tels que
 * sélectionnés dans les listes déroulantes peuplées par
 * `referentiels.service.ts`) : l'appelant (CreerNewsPage) n'a pas à
 * connaître la différence entre le contrat mock et le contrat réel.
 * `newsService.createNews` se charge de l'adapter en interne :
 *  - mode mock -> objet affiché tel quel ;
 *  - mode réel -> aplati en IDs de clé étrangère (voir
 *    news.repository.ts: NewsEcriturePayload).
 */
export interface CreerNewsInput {
  titre: string;
  type: NewsType;
  description: string;
  contenu?: string;
  province?: string;
  lieu?: string;
  /** Fichier image de couverture (optionnel). */
  image?: File;
  categorie: Categorie;
  organisation?: Organisation;
  etablissement?: Etablissement;
  tags?: string[];
  visibilite?: 'public' | 'prive' | 'limite';
  /** Utilisé uniquement en mode mock (en mode réel, l'auteur vient du token). */
  auteur?: Utilisateur;
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

  /** POST .../partager/ (ou équivalent local en mode mock) — incrémente le compteur de partages. */
  partagerNews: async (newsId: string): Promise<number> => {
    if (env.useMockData) {
      let total = 0;
      newsMemory = newsMemory.map((n) => {
        if (n.id === newsId || n.slug === newsId) {
          total = n.stats.partages + 1;
          return { ...n, stats: { ...n.stats, partages: total } };
        }
        return n;
      });
      return total;
    }
    const total = await newsRepository.partager(newsId);
    newsMemory = newsMemory.map((n) => (n.id === newsId ? { ...n, stats: { ...n.stats, partages: total } } : n));
    return total;
  },

  createNews: async (input: CreerNewsInput): Promise<News> => {
    if (env.useMockData) {
      const slug = input.titre.toLowerCase().trim().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '') || `news-${Date.now()}`;
      const created: News = {
        id: `news-${Date.now()}`,
        slug,
        type: input.type,
        titre: input.titre,
        description: input.description,
        contenu: input.contenu || '',
        // En mode mock, un fichier sélectionné est affiché via une URL
        // d'objet locale (pas de véritable upload) ; sinon image par défaut.
        image: input.image ? URL.createObjectURL(input.image) : 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
        auteur: input.auteur || {
          id: 'usr-student-789',
          username: 'amina_k',
          nomAffiche: 'Amina K.',
          role: 'etudiant',
          badges: [],
          stats: { contributions: 1, votes: 0, commentaires: 0 },
        },
        organisation: input.organisation,
        etablissement: input.etablissement,
        categorie: input.categorie,
        tags: input.tags || [],
        province: input.province || 'Estuaire',
        lieu: input.lieu,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statut: 'publie',
        visibilite: input.visibilite || 'public',
        stats: { vues: 1, commentaires: 0, reactions: { coeur: 0, jaime: 0, bravo: 0, youpi: 0, wow: 0, jaimepas: 0 }, votes: 0, partages: 0 },
        sondages: [],
        documents: [],
      };
      newsMemory = [created, ...newsMemory];
      return created;
    }

    const created = await newsRepository.create({
      titre: input.titre,
      type: input.type,
      description: input.description,
      contenu: input.contenu,
      image: input.image,
      categorieId: input.categorie.id,
      organisationId: input.organisation?.id,
      etablissementId: input.etablissement?.id,
      tags: input.tags,
      province: input.province,
      lieu: input.lieu,
      visibilite: input.visibilite,
    });
    newsMemory = [created, ...newsMemory];
    return created;
  },

  createSujet: async (input: CreerNewsInput): Promise<News> => {
    return newsService.createNews(input);
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
  partagerNews: (newsId: string) => newsRepository.partager(newsId),
};

export const sujetsBackendService = newsBackendService;

// Export de compatibilité (certains appelants importaient le type directement)
export type { NewsType };
