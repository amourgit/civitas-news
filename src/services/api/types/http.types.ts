// ============================================================
// src/services/api/types/http.types.ts
// Types HTTP transverses partagés par Get/Post/Update/DeleteService.
// ============================================================

import type { z } from 'zod';

/** Enveloppe uniforme de toute réponse traitée par la couche api/. */
export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
  cached: boolean;
}

/** Politique de nouvelle tentative en cas d'échec réseau/serveur. */
export interface RetryConfig {
  attempts: number;
  /** Délai de base en millisecondes entre deux tentatives. */
  delay: number;
  /** Si vrai, le délai double à chaque tentative (1x, 2x, 4x, ...). */
  exponentialBackoff?: boolean;
}

/** Configuration d'authentification alternative pour une requête ponctuelle. */
export interface AuthConfig {
  type: 'bearer' | 'cookie' | 'custom';
  token?: string;
  cookieName?: string;
  customHeader?: string;
  customValue?: string;
}

export interface GetRequestConfig<TResponse> {
  endpoint: string;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  /** Schéma Zod validant la réponse. Si omis, la réponse brute est renvoyée telle quelle. */
  schema?: z.ZodSchema<TResponse>;
  transform?: (data: unknown) => TResponse;
  /** Mode de cache HTTP natif du navigateur (RequestCache standard). */
  cache?: RequestCache;
  /** Durée (en secondes) pendant laquelle la réponse est mise en cache localement (mémoire du service). */
  revalidate?: number;
  timeout?: number;
  requireAuth?: boolean;
  sanitize?: boolean;
  retry?: RetryConfig;
  fallback?: TResponse;
  authConfig?: AuthConfig;
  withCredentials?: boolean;
  cookieNames?: string[];
}
