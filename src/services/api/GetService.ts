// services/GetService.ts
import { BaseHttpService } from "./base/BaseHttpService";
import { GetRequestConfig } from "../types/http.types";
import { ApiResponse } from "../types/http.types";
import { RequestSanitizer } from "../utils/sanitizer";
import { UrlBuilder } from "../utils/urlBuilder";
import { ApiError } from "../errors/ApiError";
import { ValidationError } from "../errors/ApiError";
import { NetworkError } from "../errors/ApiError";
import { z } from "zod";

// Types pour l'authentification
interface AuthConfig {
  type: 'bearer' | 'cookie' | 'custom';
  token?: string;
  cookieName?: string;
  customHeader?: string;
  customValue?: string;
}

// Interface étendue pour les cookies
interface CookieConfig {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
}

export class GetService extends BaseHttpService {
  private readonly cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

  /**
   * Effectue une requête GET avec validation et configuration avancée
   */
  async get<TResponse>(config: GetRequestConfig<TResponse>): Promise<ApiResponse<TResponse>> {
    const {
      endpoint,
      params,
      headers = {},
      schema,
      transform,
      cache = 'default',
      revalidate,
      timeout = this.defaultTimeout,
      requireAuth = false,
      sanitize = true,
      retry,
      fallback,
      // Nouvelles options d'authentification
      authConfig,
      withCredentials = false,
      cookieNames = []
    } = config;

    try {
      // Construire l'URL avec les paramètres
      const sanitizedParams = sanitize && params ? RequestSanitizer.sanitizeParams(params) : params;
      const fullUrl = UrlBuilder.buildUrl(this.baseUrl, endpoint, sanitizedParams);

      // Vérifier le cache local si applicable
      const cacheKey = this.generateCacheKey(fullUrl, headers);
      const cachedData = this.getCachedData(cacheKey);
      
      if (cachedData && cache !== 'no-cache') {
        return {
          data: cachedData as TResponse,
          status: 200,
          headers: new Headers(),
          cached: true
        };
      }

      // Construire les headers avec authentification complète
      const requestHeaders = await this.buildHeaders(headers, requireAuth, authConfig, cookieNames);

      // Créer l'AbortController pour le timeout
      const controller = this.createAbortController(timeout);

      // Configuration de la requête avec support des cookies
      const fetchConfig: RequestInit = {
        method: 'GET',
        headers: requestHeaders,
        signal: controller.signal,
        cache,
        next: revalidate ? { revalidate } : undefined,
        // Support des cookies
        credentials: withCredentials ? 'include' : 'same-origin',
      };

      // Exécuter la requête avec retry
      const response = await this.executeWithRetry(
        () => fetch(fullUrl, fetchConfig),
        retry
      );

      // Traiter la réponse
      const rawData = await this.handleResponse(response, endpoint);

      // Transformer les données si nécessaire
      const processedData = transform ? transform(rawData) : rawData;

      // Valider avec Zod
      const validatedData = await this.validateData(schema, processedData, endpoint);

      // Mettre en cache si nécessaire
      if (cache !== 'no-cache' && revalidate) {
        this.setCachedData(cacheKey, validatedData, revalidate * 1000);
      }

      return {
        data: validatedData as TResponse,
        status: response.status,
        headers: response.headers,
        cached: false
      };

    } catch (error) {
      // Gestion des erreurs avec fallback
      if (fallback !== undefined && this.shouldUseFallback(error)) {
        return {
          data: fallback,
          status: 200,
          headers: new Headers(),
          cached: false
        };
      }

      throw this.processError(error, endpoint);
    }
  }

  /**
   * Méthode utilitaire pour les requêtes GET simples avec auth automatique
   */
  async getSimple<TResponse>(
    endpoint: string,
    schema: z.ZodSchema<TResponse>,
    params?: Record<string, unknown>,
    withAuth: boolean = false
  ): Promise<TResponse> {
    const response = await this.get({ 
      endpoint, 
      schema, 
      params,
      requireAuth: withAuth,
      withCredentials: withAuth 
    });
    return response.data;
  }

  /**
   * Méthode spécifique pour les requêtes authentifiées
   */
  async getAuthenticated<TResponse>(
    endpoint: string,
    schema: z.ZodSchema<TResponse>,
    params?: Record<string, unknown>,
    authConfig?: AuthConfig
  ): Promise<TResponse> {
    const response = await this.get({
      endpoint,
      schema,
      params,
      requireAuth: true,
      withCredentials: true,
      authConfig,
      cookieNames: ['authToken', 'sessionId', 'refreshToken'] // Cookies d'auth courants
    });
    return response.data;
  }

  /**
   * Méthode pour les requêtes GET avec pagination et auth
   */
  async getPaginated<TResponse>(
    endpoint: string,
    schema: z.ZodSchema<TResponse>,
    page: number = 1,
    limit: number = 10,
    additionalParams?: Record<string, unknown>,
    requireAuth: boolean = false
  ): Promise<TResponse> {
    const params = {
      page,
      limit,
      ...additionalParams
    };

    return requireAuth 
      ? this.getAuthenticated(endpoint, schema, params)
      : this.getSimple(endpoint, schema, params);
  }

  // === MÉTHODES PRIVÉES AMÉLIORÉES ===

  private async buildHeaders(
    headers: HeadersInit, 
    requireAuth: boolean, 
    authConfig?: AuthConfig,
    cookieNames: string[] = []
  ): Promise<HeadersInit> {
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    if (requireAuth || authConfig) {
      await this.addAuthenticationHeaders(requestHeaders, authConfig);
    }

    // Ajouter les cookies spécifiques si demandés
    if (cookieNames.length > 0) {
      this.addCookieHeaders(requestHeaders, cookieNames);
    }

    return requestHeaders;
  }

  private async addAuthenticationHeaders(
    headers: Record<string, string>,
    authConfig?: AuthConfig
  ): Promise<void> {
    if (authConfig) {
      // Configuration personnalisée d'authentification
      switch (authConfig.type) {
        case 'bearer':
          const token = authConfig.token || await this.getAuthToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          break;

        case 'cookie':
          if (authConfig.cookieName) {
            const cookieValue = this.getCookieValue(authConfig.cookieName);
            if (cookieValue && authConfig.cookieName) {
              headers['Cookie'] = `${authConfig.cookieName}=${cookieValue}`;
            }
          }
          break;

        case 'custom':
          if (authConfig.customHeader && authConfig.customValue) {
            headers[authConfig.customHeader] = authConfig.customValue;
          }
          break;
      }
    } else {
      // Authentification par défaut (Bearer token)
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
  }

  private addCookieHeaders(headers: Record<string, string>, cookieNames: string[]): void {
    const cookies: string[] = [];
    
    cookieNames.forEach(cookieName => {
      const cookieValue = this.getCookieValue(cookieName);
      if (cookieValue) {
        cookies.push(`${cookieName}=${cookieValue}`);
      }
    });

    if (cookies.length > 0) {
      // Ajouter aux cookies existants ou créer nouveau header
      const existingCookies = headers['Cookie'];
      headers['Cookie'] = existingCookies 
        ? `${existingCookies}; ${cookies.join('; ')}`
        : cookies.join('; ');
    }
  }

  private async getAuthToken(): Promise<string | null> {
    // Priorité : cookies -> localStorage -> sessionStorage
    
    // 1. Essayer les cookies d'abord
    const cookieToken = this.getCookieValue('authToken') || 
                       this.getCookieValue('access_token') ||
                       this.getCookieValue('token');
    
    if (cookieToken) {
      return cookieToken;
    }

    // 2. Ensuite localStorage
    if (typeof window !== 'undefined') {
      const localToken = this.getToken() || 
                        localStorage.getItem('access_token') ||
                        localStorage.getItem('token');
      
      if (localToken) {
        return localToken;
      }

      // 3. Finalement sessionStorage
      const sessionToken = this.getToken() ||
                          sessionStorage.getItem('access_token') ||
                          sessionStorage.getItem('token');
      
      return sessionToken;
    }

    return null;
  }

  private getCookieValue(name: string): string | null {
    if (typeof document === 'undefined') {
      return null; // Mode server-side
    }

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift();
      return cookieValue || null;
    }
    
    return null;
  }

  /**
   * Méthode utilitaire pour définir des cookies (côté client)
   */
  public setCookie(config: CookieConfig): void {
    if (typeof document === 'undefined') {
      console.warn('setCookie can only be used in browser environment');
      return;
    }

    let cookieString = `${config.name}=${config.value}`;
    
    if (config.domain) cookieString += `; domain=${config.domain}`;
    if (config.path) cookieString += `; path=${config.path}`;
    if (config.secure) cookieString += `; secure`;
    if (config.httpOnly) cookieString += `; httpOnly`;

    document.cookie = cookieString;
  }

  /**
   * Méthode utilitaire pour supprimer des cookies
   */
  public deleteCookie(name: string, path: string = '/', domain?: string): void {
    if (typeof document === 'undefined') {
      console.warn('deleteCookie can only be used in browser environment');
      return;
    }

    let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
    if (domain) cookieString += `; domain=${domain}`;
    
    document.cookie = cookieString;
  }

  // === MÉTHODES PRIVÉES ORIGINALES ===

  private generateCacheKey(url: string, headers: HeadersInit): string {
    const headersString = JSON.stringify(headers);
    return `${url}:${headersString}`;
  }

  private getCachedData(key: string): unknown | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCachedData(key: string, data: unknown, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private async validateData<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    endpoint: string
  ): Promise<T> {
    try {
      return await schema.parseAsync(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError(
          'Response validation failed',
          error.issues,
          endpoint
        );
      }
      throw error;
    }
  }

  private shouldUseFallback(error: unknown): boolean {
    return error instanceof NetworkError || 
           (error instanceof ApiError && error.status >= 500);
  }

  private processError(error: unknown, endpoint: string): Error {
    if (error instanceof ApiError || error instanceof ValidationError) {
      return error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new NetworkError('Network connection failed', error as Error, endpoint);
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      return new NetworkError('Request timeout', error as Error, endpoint);
    }

    return new ApiError('Unknown error occurred', 500, 'UNKNOWN_ERROR', endpoint);
  }

  /**
   * Méthode pour nettoyer le cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Méthode pour obtenir les statistiques du cache
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}