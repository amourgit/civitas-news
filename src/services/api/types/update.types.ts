// ============================================================
// src/services/api/types/update.types.ts
// Types de configuration pour UpdateService (PUT, PATCH, bulk
// update, résolution de conflits, mises à jour optimistes).
// ============================================================

import type { z } from 'zod';
import type { RetryConfig } from './http.types';
import type { ConflictInfo } from '../errors/ConflictError';

export type { ConflictInfo };

/** Stratégie appliquée quand le serveur répond 409 (conflit de version). */
export type ConflictResolutionStrategy = 'client' | 'server' | 'merge';

export interface PutRequestConfig<TRequest, TResponse> {
  endpoint: string;
  resourceId: string | number;
  body: TRequest;
  bodySchema?: z.ZodSchema<TRequest>;
  responseSchema?: z.ZodSchema<TResponse>;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  transform?: (data: unknown) => TResponse;
  timeout?: number;
  requireAuth?: boolean;
  sanitize?: boolean;
  validateRequest?: boolean;
  optimisticUpdate?: boolean;
  conflictResolution?: ConflictResolutionStrategy;
  /** Valeur ETag connue côté client, envoyée dans `If-Match`. */
  etag?: string;
  /** Date de dernière modification connue côté client, envoyée dans `If-Unmodified-Since`. */
  lastModified?: string;
  /** 'full' remplace la ressource ; 'merge' fusionne avec la version serveur avant envoi. */
  replaceStrategy?: 'full' | 'merge';
  retry?: RetryConfig;
  fallback?: TResponse;
}

export type PatchFormat = 'merge-patch' | 'json-patch' | 'custom';

export interface PatchRequestConfig<TRequest, TResponse> {
  endpoint: string;
  resourceId: string | number;
  patches: Partial<TRequest> | TRequest;
  patchSchema?: z.ZodSchema<unknown>;
  responseSchema?: z.ZodSchema<TResponse>;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  transform?: (data: unknown) => TResponse;
  timeout?: number;
  requireAuth?: boolean;
  sanitize?: boolean;
  validatePatches?: boolean;
  optimisticUpdate?: boolean;
  conflictResolution?: ConflictResolutionStrategy;
  etag?: string;
  lastModified?: string;
  patchFormat?: PatchFormat;
  retry?: RetryConfig;
  fallback?: TResponse;
}

export interface PatchFileUploadConfig<TResponse> {
  endpoint: string;
  resourceId: string | number;
  files: File[];
  fieldName?: string;
  additionalFields?: Record<string, unknown>;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
  requireAuth?: boolean;
  responseSchema?: z.ZodSchema<TResponse>;
  transform?: (data: unknown) => TResponse;
  retry?: RetryConfig;
  fallback?: TResponse;
}

export interface BulkUpdateConfig<TRequest, TResponse> {
  endpoint: string;
  updates: Array<{ id: string | number; data: Partial<TRequest> | TRequest; method?: 'PUT' | 'PATCH' }>;
  bodySchema?: z.ZodSchema<unknown>;
  responseSchema?: z.ZodSchema<TResponse>;
  batchSize?: number;
  concurrent?: boolean;
  stopOnError?: boolean;
  onProgress?: (completed: number, total: number, errors: Error[]) => void;
  timeout?: number;
  requireAuth?: boolean;
}

export interface OptimisticUpdateMetadata {
  id: string;
  resourceId: string | number;
  originalData: unknown;
  optimisticData: unknown;
  timestamp: number;
  rollbackFn: () => void;
}

export interface JsonPatchOperation {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  path: string;
  value?: unknown;
  from?: string;
}
