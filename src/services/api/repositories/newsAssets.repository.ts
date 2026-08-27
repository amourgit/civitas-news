// ============================================================
// src/services/api/repositories/newsAssets.repository.ts
// Sous-ressources de News — médias riches, galerie d'images, documents
// joints. App backend séparée (voir Backend-Core-Base
// news/api/v1/views.py:NewsMediaViewSet/NewsImageGalerieViewSet/
// DocumentJointViewSet, ajoutée pour couvrir ces modèles jusqu'ici sans
// endpoint dédié) : filtrage par `?news=<id>`, `news` requis dans le
// corps à la création. Consommé par l'onglet "Médias" de la page de
// détail News du backoffice (voir src/components/backoffice/).
// ============================================================

import { http } from './httpClient';
import { NEWS_ENDPOINTS } from '../endpoints';
import {
  NewsMediaItemSchema, type NewsMediaItem, type NewsMediaType,
  DocumentJointSchema, type DocumentJoint,
  NewsImageGalerieItemSchema, type NewsImageGalerieItem,
} from '../../../types/global.types';
import { paginatedSchema, fetchAllPages } from '../utils/pagination';

export interface NewsMediaEcriturePayload {
  newsId: string;
  type: NewsMediaType;
  /** Fichier local (vidéo/audio/document/image hébergée) — mutuellement exclusif avec `urlExterne`. */
  fichier?: File;
  /** Lien externe (ex: URL YouTube) — mutuellement exclusif avec `fichier`. */
  urlExterne?: string;
  vignette?: File;
  titre: string;
  description?: string;
  duree?: string;
  ordre?: number;
}

export interface NewsMediaUpdatePayload extends Partial<Omit<NewsMediaEcriturePayload, 'newsId'>> {}

export const newsMediasRepository = {
  async listByNews(newsId: string): Promise<NewsMediaItem[]> {
    return fetchAllPages<NewsMediaItem>(async (page) => {
      const response = await http.get.get({
        endpoint: NEWS_ENDPOINTS.medias,
        params: { news: newsId, page },
        schema: paginatedSchema(NewsMediaItemSchema),
        requireAuth: false,
      });
      return { results: response.data.results, next: response.data.next };
    });
  },

  async create(payload: NewsMediaEcriturePayload): Promise<NewsMediaItem> {
    const { newsId, fichier, vignette, ...scalar } = payload;
    const fields: Record<string, unknown> = { news: newsId, ...scalar };
    Object.keys(fields).forEach((key) => fields[key] === undefined && delete fields[key]);

    if (fichier) {
      // Convertir les champs scalaires en snake_case pour FormData
      const formDataFields: Record<string, unknown> = {};
      Object.entries(fields).forEach(([key, value]) => {
        const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
        formDataFields[snakeKey] = value;
      });

      const response = await http.post.uploadFiles<NewsMediaItem>({
        endpoint: NEWS_ENDPOINTS.medias,
        files: vignette ? [fichier, vignette] : [fichier],
        fieldName: 'fichier',
        additionalFields: formDataFields,
        responseSchema: NewsMediaItemSchema,
        requireAuth: true,
      });
      return response.data;
    }
    const response = await http.post.post<Record<string, unknown>, NewsMediaItem>({
      endpoint: NEWS_ENDPOINTS.medias,
      body: fields,
      responseSchema: NewsMediaItemSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async update(id: string, payload: NewsMediaUpdatePayload): Promise<NewsMediaItem> {
    const { fichier, vignette, ...rest } = payload;
    const fields: Record<string, unknown> = { ...rest };
    Object.keys(fields).forEach((key) => fields[key] === undefined && delete fields[key]);

    if (fichier || vignette) {
      const files: File[] = [];
      if (fichier) files.push(fichier);
      if (vignette) files.push(vignette);

      const response = await http.update.patchWithFiles<NewsMediaItem>({
        endpoint: NEWS_ENDPOINTS.medias,
        resourceId: id,
        files,
        fieldName: 'fichier',
        additionalFields: fields,
        responseSchema: NewsMediaItemSchema,
        requireAuth: true,
      });
      return response.data;
    }

    const response = await http.update.patch<typeof payload, NewsMediaItem>({
      endpoint: NEWS_ENDPOINTS.medias,
      resourceId: id,
      patches: payload,
      responseSchema: NewsMediaItemSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await http.delete.delete({ endpoint: NEWS_ENDPOINTS.medias, resourceId: id, requireAuth: true });
  },
};

export const newsGalerieRepository = {
  async listByNews(newsId: string): Promise<NewsImageGalerieItem[]> {
    return fetchAllPages<NewsImageGalerieItem>(async (page) => {
      const response = await http.get.get({
        endpoint: NEWS_ENDPOINTS.galerie,
        params: { news: newsId, page },
        schema: paginatedSchema(NewsImageGalerieItemSchema),
        requireAuth: false,
      });
      return { results: response.data.results, next: response.data.next };
    });
  },

  async create(newsId: string, image: File, legende?: string, ordre?: number): Promise<NewsImageGalerieItem> {
    const response = await http.post.uploadFiles<NewsImageGalerieItem>({
      endpoint: NEWS_ENDPOINTS.galerie,
      files: [image],
      fieldName: 'image',
      additionalFields: { news: newsId, legende, ordre },
      responseSchema: NewsImageGalerieItemSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async update(id: string, payload: { legende?: string; ordre?: number; image?: File }): Promise<NewsImageGalerieItem> {
    const { image, ...rest } = payload;

    if (image) {
      const response = await http.update.patchWithFiles<NewsImageGalerieItem>({
        endpoint: NEWS_ENDPOINTS.galerie,
        resourceId: id,
        files: [image],
        fieldName: 'image',
        additionalFields: rest,
        responseSchema: NewsImageGalerieItemSchema,
        requireAuth: true,
      });
      return response.data;
    }

    const response = await http.update.patch<typeof payload, NewsImageGalerieItem>({
      endpoint: NEWS_ENDPOINTS.galerie,
      resourceId: id,
      patches: payload,
      responseSchema: NewsImageGalerieItemSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await http.delete.delete({ endpoint: NEWS_ENDPOINTS.galerie, resourceId: id, requireAuth: true });
  },
};

export const newsDocumentsRepository = {
  async listByNews(newsId: string): Promise<DocumentJoint[]> {
    return fetchAllPages<DocumentJoint>(async (page) => {
      const response = await http.get.get({
        endpoint: NEWS_ENDPOINTS.documents,
        params: { news: newsId, page },
        schema: paginatedSchema(DocumentJointSchema),
        requireAuth: false,
      });
      return { results: response.data.results, next: response.data.next };
    });
  },

  /** `taille`/`type` sont calculés côté serveur (DocumentJoint.save) —
   * jamais envoyés par le client, voir models.py. */
  async create(newsId: string, fichier: File, nom?: string): Promise<DocumentJoint> {
    const response = await http.post.uploadFiles<DocumentJoint>({
      endpoint: NEWS_ENDPOINTS.documents,
      files: [fichier],
      fieldName: 'fichier',
      additionalFields: { news: newsId, nom: nom ?? fichier.name },
      responseSchema: DocumentJointSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async update(id: string, payload: { nom?: string; fichier?: File }): Promise<DocumentJoint> {
    const { fichier, ...rest } = payload;

    if (fichier) {
      const response = await http.update.patchWithFiles<DocumentJoint>({
        endpoint: NEWS_ENDPOINTS.documents,
        resourceId: id,
        files: [fichier],
        fieldName: 'fichier',
        additionalFields: rest,
        responseSchema: DocumentJointSchema,
        requireAuth: true,
      });
      return response.data;
    }

    const response = await http.update.patch<typeof payload, DocumentJoint>({
      endpoint: NEWS_ENDPOINTS.documents,
      resourceId: id,
      patches: payload,
      responseSchema: DocumentJointSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await http.delete.delete({ endpoint: NEWS_ENDPOINTS.documents, resourceId: id, requireAuth: true });
  },
};
