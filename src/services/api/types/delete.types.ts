// ============================================================
// src/services/api/types/delete.types.ts
// Types de configuration pour DeleteService (suppression simple,
// en lot, conditionnelle, planifiée, restauration soft-delete).
// ============================================================

import type { z } from 'zod';
import type { RetryConfig } from './http.types';

export interface DeleteRequestConfig<TResponse = void> {
  endpoint: string;
  resourceId?: string | number;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  responseSchema?: z.ZodSchema<TResponse>;
  transform?: (data: unknown) => TResponse;
  timeout?: number;
  requireAuth?: boolean;
  optimisticDelete?: boolean;
  confirmationToken?: string;
  /** Supprime également les ressources dépendantes. */
  cascade?: boolean;
  /** Marque la ressource comme supprimée sans effacement définitif. */
  softDelete?: boolean;
  /** Ignore les protections/dépendances détectées (à utiliser avec précaution). */
  forceDelete?: boolean;
  backupBeforeDelete?: boolean;
  reason?: string;
  dependencies?: string[];
  retry?: RetryConfig;
}

export interface BulkDeleteConfig<TResponse = void> {
  endpoint: string;
  resourceIds: Array<string | number>;
  responseSchema?: z.ZodSchema<TResponse>;
  batchSize?: number;
  concurrent?: boolean;
  stopOnError?: boolean;
  cascade?: boolean;
  softDelete?: boolean;
  onProgress?: (completed: number, total: number, errors: Error[]) => void;
  confirmationTokens?: Map<string | number, string>;
  timeout?: number;
  requireAuth?: boolean;
}

export interface ConditionalDeleteConfig<TResponse = void> {
  endpoint: string;
  conditions: Record<string, unknown>;
  conditionsSchema?: z.ZodSchema<unknown>;
  responseSchema?: z.ZodSchema<TResponse>;
  /** Simule la suppression et retourne ce qui aurait été supprimé, sans rien effacer. */
  dryRun?: boolean;
  maxItems?: number;
  cascade?: boolean;
  softDelete?: boolean;
  timeout?: number;
  requireAuth?: boolean;
}

export interface RestoreConfig<TResponse = void> {
  endpoint: string;
  resourceId: string | number;
  responseSchema?: z.ZodSchema<TResponse>;
  restorePoint?: string;
  cascadeRestore?: boolean;
  timeout?: number;
  requireAuth?: boolean;
}

export interface OptimisticDeleteMetadata {
  id: string;
  resourceId: string | number;
  originalData: unknown;
  timestamp: number;
  softDelete: boolean;
  rollbackFn: () => void | Promise<void>;
  restoreFn: () => void | Promise<void>;
}

export interface DeleteConfirmation {
  token: string;
  expiresAt: Date;
  resourceInfo?: unknown;
  warnings?: string[];
}

export interface ScheduledDeleteConfig {
  endpoint: string;
  resourceId: string | number;
  scheduledFor: string | Date;
  timezone?: string;
  recurring?: { frequency: 'daily' | 'weekly' | 'monthly'; until?: string } | null;
  notifyBeforeDelete?: boolean;
  cascade?: boolean;
  softDelete?: boolean;
  reason?: string;
}

export interface DeletedResourceInfo {
  id: string | number;
  type: string;
  deletedAt: Date;
  reason?: string;
  canRestore: boolean;
  restoreUntil?: Date;
}
