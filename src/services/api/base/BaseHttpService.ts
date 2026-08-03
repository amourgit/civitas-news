// ============================================================
// src/services/base/BaseHttpService.ts
// SERVICE LEGACY — NEUTRALISÉ
//
// Ces services ne sont plus utilisés par l'application principale.
// La gestion des tokens est entièrement prise en charge par :
//   - lib/http-client.ts       (requêtes API sécurisées)
//   - lib/security/token-manager.ts (tokens en mémoire)
//   - app/api/auth/            (Route Handlers, cookies HttpOnly)
//
// Ce fichier est conservé pour compatibilité avec src/types/ uniquement.
// NE PAS utiliser getToken(), setToken(), removeToken() de cette classe.
// ============================================================

import { ApiError }       from '../../errors/ApiError';
import { RetryConfig }    from '../../types/http.types';
import { z }              from 'zod';
import { ValidationError } from '../../errors/ValidatatorError';
import { NetworkError }   from '../../errors/NetworkError';
import { ConflictError }  from '../../errors/ConflitsError';
import { DeleteError }    from '../../errors/DeleteError';

export abstract class BaseHttpService {
  protected readonly baseUrl:         string;
  protected readonly defaultHeaders:  HeadersInit;
  protected readonly defaultTimeout:  number;

  constructor(
    baseUrl:         string       = process.env.NEXT_PUBLIC_API_BASE_URL || '',
    defaultHeaders:  HeadersInit  = {},
    defaultTimeout:  number       = 10000
  ) {
    this.baseUrl        = baseUrl;
    this.defaultHeaders = {
      'Content-Type':    'application/json',
      'Accept':          'application/json',
      'X-Requested-With':'XMLHttpRequest',
      ...defaultHeaders,
    };
    this.defaultTimeout = defaultTimeout;
  }

  protected async executeWithRetry<T>(
    operation:   () => Promise<T>,
    retryConfig?: RetryConfig
  ): Promise<T> {
    if (!retryConfig) return operation();

    let lastError: Error = new Error('Unknown error');
    const { attempts, delay, exponentialBackoff = true } = retryConfig;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < attempts) {
          const waitMs = exponentialBackoff ? delay * Math.pow(2, attempt - 1) : delay;
          await new Promise((res) => setTimeout(res, waitMs));
        }
      }
    }
    throw lastError;
  }

  // ── Token : redirigé vers tokenManager (sécurisé) ────────
  // @deprecated — Utiliser lib/security/token-manager.ts directement
  protected getToken(): string | null {
    if (typeof window === 'undefined') return null;
    // Import dynamique pour éviter les dépendances circulaires au build
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { tokenManager } = require('@/lib/security/token-manager');
      return tokenManager.getAccessToken();
    } catch {
      return null;
    }
  }

  // @deprecated — Les tokens sont gérés par les Route Handlers
  protected setToken(_token: string): void {
    console.warn('[BaseHttpService] setToken() est déprécié. Utiliser /api/auth/set-tokens.');
  }

  // @deprecated — Les tokens sont gérés par les Route Handlers
  protected removeToken(): void {
    console.warn('[BaseHttpService] removeToken() est déprécié. Utiliser /api/auth/logout.');
  }

  protected handleError(error: unknown): never {
    if (error instanceof ApiError)        throw error;
    if (error instanceof ValidationError) throw error;
    if (error instanceof NetworkError)    throw error;
    if (error instanceof ConflictError)   throw error;
    if (error instanceof DeleteError)     throw error;

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('Erreur réseau — vérifiez votre connexion');
    }
    throw new ApiError('Erreur inattendue', 500, error);
  }

  protected buildUrl(path: string, params?: Record<string, unknown>): string {
    const url = new URL(path, this.baseUrl);
    if (params) {
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .forEach(([k, v]) => url.searchParams.append(k, String(v)));
    }
    return url.toString();
  }

  protected async buildHeaders(extra: Record<string, string> = {}): Promise<HeadersInit> {
    const token = this.getToken();
    return {
      ...this.defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
    };
  }

  protected async validateResponse<T>(
    response: Response,
    schema?: z.ZodSchema<T>
  ): Promise<T> {
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new ApiError(
        body?.detail || body?.message || response.statusText,
        response.status,
        body
      );
    }
    const data = await response.json();
    if (schema) {
      const result = schema.safeParse(data);
      if (!result.success) throw new ValidationError('Données invalides', result.error.errors);
      return result.data;
    }
    return data as T;
  }
}
