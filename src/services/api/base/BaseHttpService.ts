// ============================================================
// src/services/api/base/BaseHttpService.ts
// Socle commun de tous les services HTTP (Get/Post/Update/Delete).
// Centralise : URL de base, headers par défaut, retry, token
// d'authentification, parsing de réponse et normalisation des
// erreurs.
// ============================================================

import { z } from 'zod';
import { env } from '../../../config/env';
import { tokenStore } from '../token/tokenStore';
import { ApiError } from '../errors/ApiError';
import { ValidationError } from '../errors/ValidationError';
import { NetworkError } from '../errors/NetworkError';
import { ConflictError } from '../errors/ConflictError';
import { DeleteError } from '../errors/DeleteError';
import type { RetryConfig } from '../types/http.types';

export abstract class BaseHttpService {
  protected readonly baseUrl: string;
  protected readonly defaultHeaders: Record<string, string>;
  protected readonly defaultTimeout: number;

  constructor(
    baseUrl: string = env.apiBaseUrl,
    defaultHeaders: Record<string, string> = {},
    defaultTimeout: number = 20000
  ) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...defaultHeaders,
    };
    this.defaultTimeout = defaultTimeout;
  }

  protected async executeWithRetry<T>(operation: () => Promise<T>, retryConfig?: RetryConfig): Promise<T> {
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

  /** Crée un AbortController qui s'auto-déclenche après `timeoutMs`. */
  protected createAbortController(timeoutMs: number): AbortController {
    const controller = new AbortController();
    if (timeoutMs > 0) {
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      // Ne bloque pas la fin de process Node (utile en tests vitest/jsdom).
      (timer as unknown as { unref?: () => void }).unref?.();
    }
    return controller;
  }

  // ── Authentification ──────────────────────────────────────
  protected getToken(): string | null {
    return tokenStore.getAccessToken();
  }

  protected setToken(token: string): void {
    tokenStore.setTokens({ access: token });
  }

  protected removeToken(): void {
    tokenStore.clear();
  }

  protected async getAuthToken(): Promise<string | null> {
    return this.getToken();
  }

  // ── Réponse / Erreurs ──────────────────────────────────────

  /** Parse le corps d'une réponse et lève une ApiError normalisée si `!response.ok`. */
  protected async handleResponse<T = unknown>(response: Response, endpoint?: string): Promise<T> {
    const contentType = response.headers.get('Content-Type') || '';
    const isJson = contentType.includes('application/json');

    if (!response.ok) {
      const body = isJson ? await response.json().catch(() => ({})) : await response.text().catch(() => '');
      const message =
        (typeof body === 'object' && body !== null && (body as Record<string, unknown>).detail) ||
        (typeof body === 'object' && body !== null && (body as Record<string, unknown>).message) ||
        response.statusText ||
        `Erreur HTTP ${response.status}`;
      // `code` (ex: 'ACCOUNT_NOT_FOUND', voir CustomTokenObtainPairView
      // côté backend) permet à l'appelant de distinguer des scénarios
      // métier précis sans avoir à parser le texte du message — voir
      // LoginPage.tsx, qui propose la création de compte UNIQUEMENT sur
      // ce code, jamais sur un simple statut 4xx générique.
      const code = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).code : undefined;
      throw new ApiError(String(message), response.status, typeof code === 'string' ? code : undefined, endpoint, body);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    if (!isJson) {
      return (await response.text()) as unknown as T;
    }

    return (await response.json()) as T;
  }

  protected handleError(error: unknown): never {
    if (error instanceof ApiError) throw error;
    if (error instanceof ValidationError) throw error;
    if (error instanceof NetworkError) throw error;
    if (error instanceof ConflictError) throw error;
    if (error instanceof DeleteError) throw error;

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('Erreur réseau — vérifiez votre connexion');
    }
    throw new ApiError('Erreur inattendue', 500, 'UNKNOWN_ERROR', undefined, error);
  }

  // ── Helpers ────────────────────────────────────────────────

  protected buildUrl(path: string, params?: Record<string, unknown>): string {
    const isAbsolute = /^https?:\/\//i.test(path);
    const url = new URL(path, isAbsolute ? undefined : this.baseUrl || window.location.origin);
    if (params) {
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .forEach(([k, v]) => url.searchParams.append(k, String(v)));
    }
    return url.toString();
  }

  protected async buildHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
    const token = this.getToken();
    return {
      ...this.defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
    };
  }

  protected async validateResponse<T>(response: Response, schema?: z.ZodSchema<T>): Promise<T> {
    const data = await this.handleResponse<T>(response);
    if (schema) {
      const result = schema.safeParse(data);
      if (!result.success) throw new ValidationError('Données invalides', result.error.issues);
      return result.data;
    }
    return data;
  }
}
