// ============================================================
// src/services/api/types/post.types.ts
// Types de configuration pour PostService (POST simple, upload,
// requêtes en lot).
// ============================================================

import type { z } from 'zod';
import type { RetryConfig } from './http.types';

export interface PostRequestConfig<TRequest, TResponse> {
  endpoint: string;
  body: TRequest;
  /** Schéma Zod validant le corps envoyé (avant sanitisation réseau). */
  bodySchema?: z.ZodSchema<TRequest>;
  /** Schéma Zod validant la réponse. Si omis, la réponse brute est renvoyée telle quelle. */
  responseSchema?: z.ZodSchema<TResponse>;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  transform?: (data: unknown) => TResponse;
  timeout?: number;
  requireAuth?: boolean;
  sanitize?: boolean;
  validateRequest?: boolean;
  /** Applique une mise à jour optimiste locale avant confirmation serveur. */
  optimisticUpdate?: boolean;
  /** Clé d'idempotence envoyée en en-tête pour éviter les doublons (double-clic, retry réseau...). */
  idempotencyKey?: string;
  retry?: RetryConfig;
  fallback?: TResponse;
}

export interface FileUploadConfig<TResponse> {
  endpoint: string;
  files: FileList | File[];
  /** Nom du champ multipart (défaut: "files"). */
  fieldName?: string;
  additionalFields?: Record<string, unknown>;
  params?: Record<string, unknown>;
  timeout?: number;
  requireAuth?: boolean;
  responseSchema?: z.ZodSchema<TResponse>;
  /** Taille maximale autorisée par fichier, en octets. */
  maxFileSize?: number;
  /** Types MIME autorisés (ex: ['image/png', 'image/jpeg']). */
  allowedTypes?: string[];
  onProgress?: (event: ProgressEvent) => void;
  retry?: RetryConfig;
}

export interface BatchRequestConfig<TRequest, TResponse> {
  endpoint: string;
  requests: TRequest[];
  bodySchema?: z.ZodSchema<TRequest>;
  responseSchema?: z.ZodSchema<TResponse>;
  /** Nombre de requêtes envoyées par lot (défaut: 5). */
  batchSize?: number;
  /** Envoie les requêtes d'un même lot en parallèle plutôt qu'en séquence. */
  concurrent?: boolean;
  stopOnError?: boolean;
  onBatchProgress?: (completed: number, total: number) => void;
  timeout?: number;
  requireAuth?: boolean;
}
