// ============================================================
// src/services/api/repositories/news.repository.ts
// Implémentation RÉELLE et complète du domaine News, construite
// à 100% sur le socle services/api/ (Get/Post/Update/DeleteService).
//
// Utilisée dès que env.useMockData === false (voir src/config/env.ts).
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

/**
 * Forme d'ÉCRITURE de News — distincte de la forme de LECTURE (`News`).
 * Le backend (news/api/v1/serializers.py: NewsEcritureSerializer) attend
 * `categorie`/`organisation`/`etablissement` comme de simples IDs de clé
 * étrangère, jamais les objets imbriqués complets que renvoie la lecture.
 * `categorieId` est obligatoire côté backend (FK non nullable) ;
 * `organisationId`/`etablissementId` sont optionnels.
 */
export interface NewsEcriturePayload {
  slug?: string;
  type: NewsType;
  titre: string;
  description: string;
  contenu?: string;
  /** Fichier image de couverture (optionnel — le champ backend est un ImageField, pas une URL). */
  image?: File;
  categorieId: string;
  organisationId?: string;
  etablissementId?: string;
  tags?: string[];
  province?: string;
  lieu?: string;
  dateDebut?: string;
  dateFin?: string;
  statut?: 'brouillon' | 'publie' | 'archive' | 'signale';
  visibilite?: 'public' | 'prive' | 'limite';
}

/** camelCase -> snake_case, une seule profondeur (suffisant pour ce payload plat). */
function toSnakeCaseKeys(fields: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    out[snakeKey] = value;
  }
  return out;
}

/** Aplati le payload d'écriture vers les noms de champs attendus par NewsEcritureSerializer. */
function buildScalarFields(payload: Omit<NewsEcriturePayload, 'image'>): Record<string, unknown> {
  const { categorieId, organisationId, etablissementId, ...rest } = payload;
  const fields: Record<string, unknown> = {
    ...rest,
    categorie: categorieId,
    organisation: organisationId,
    etablissement: etablissementId,
  };
  Object.keys(fields).forEach((key) => {
    if (fields[key] === undefined) delete fields[key];
  });
  return fields;
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

  /** POST .../partager/ — incrémente le compteur de partages, renvoie le total à jour. */
  async partager(newsId: string): Promise<number> {
    const response = await http.post.post<Record<string, never>, { partages: number }>({
      endpoint: NEWS_ENDPOINTS.partager(newsId),
      body: {},
      requireAuth: true,
    });
    return response.data.partages;
  },

  async create(payload: NewsEcriturePayload): Promise<News> {
    const scalarFields = buildScalarFields(payload);

    if (payload.image) {
      // multipart/form-data : pas de CamelCaseJSONParser côté backend sur
      // cette route (MultiPartParser), donc les clés doivent être en
      // snake_case et les tableaux (tags) passent en clés répétées.
      const response = await http.post.uploadFiles<News>({
        endpoint: NEWS_ENDPOINTS.list,
        files: [payload.image],
        fieldName: 'image',
        additionalFields: toSnakeCaseKeys(scalarFields),
        responseSchema: NewsSchema,
        requireAuth: true,
      });
      return response.data;
    }

    // JSON : CamelCaseJSONParser convertit automatiquement côté backend.
    const response = await http.post.post<Record<string, unknown>, News>({
      endpoint: NEWS_ENDPOINTS.list,
      body: scalarFields,
      responseSchema: NewsSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async update(id: string, payload: Partial<Omit<NewsEcriturePayload, 'image'>>): Promise<News> {
    const scalarFields = buildScalarFields({ categorieId: '', ...payload } as Omit<NewsEcriturePayload, 'image'>);
    // categorieId n'est pas forcément fourni sur une mise à jour partielle :
    // on ne l'envoie que si l'appelant l'a explicitement précisé.
    if (payload.categorieId === undefined) delete scalarFields.categorie;

    const response = await http.update.patch<Record<string, unknown>, News>({
      endpoint: NEWS_ENDPOINTS.list,
      resourceId: id,
      patches: scalarFields,
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
