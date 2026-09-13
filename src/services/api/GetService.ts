// services/GetService.ts
import { BaseHttpService } from "./base/BaseHttpService";
import type { GetRequestConfig, ApiResponse, AuthConfig } from "./types/http.types";
import { RequestSanitizer } from "./utils/sanitizer";
import { UrlBuilder } from "./utils/urlBuilder";
import { ApiError, ValidationError, NetworkError } from "./errors";
import { unwrapToPrimaryTenant } from "./utils/tenantEnvelope";
import { getCacheStore } from "./cache/getCache";
import { getTenantHeaderListValue } from "../../store/tenants.store";
import { z } from "zod";

// Interface étendue pour les cookies
interface CookieConfig {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
}

// Durée par défaut (s) de mise en cache d'une réponse GET quand
// l'appelant ne précise pas `revalidate` explicitement -- avant ce
// correctif, l'écriture dans le cache était conditionnée à un
// `revalidate` que RIEN dans l'app ne passait jamais (grep sur tout
// src/ : aucun appelant), rendant ce cache totalement mort en
// pratique. 20s absorbe l'essentiel du trafic "lourd" (montages
// multiples de composants lisant la même liste, navigation
// aller-retour, re-renders) sans risquer une fraîcheur perçue
// dégradée -- et toute mutation réussie vide le cache entier de toute
// façon (voir authFetchInterceptor.ts), donc la fenêtre de péremption
// réelle est souvent bien plus courte que 20s.
const DEFAULT_GET_CACHE_TTL_SECONDS = 20;

export class GetService extends BaseHttpService {
  // Requêtes GET identiques déjà en vol (même clé de cache) : partagées
  // plutôt que reparties en double. Complémentaire du cache TTL
  // ci-dessus -- celui-ci couvre les lectures RÉPÉTÉES dans le temps,
  // celui-là couvre les lectures SIMULTANÉES (plusieurs composants qui
  // montent en même temps et demandent chacun la même ressource,
  // React StrictMode qui double les effets en dev, etc.) : aucun coût
  // de fraîcheur puisqu'elles partagent littéralement le même appel
  // réseau en cours.
  private readonly inFlight = new Map<string, Promise<{ data: unknown; status: number; headers: Headers }>>();

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
      // Repli automatique : le premier accès (cold start Render -- le
      // service peut mettre 30-60s à se réveiller après une période
      // d'inactivité -- ou simple aléa réseau) échouait silencieusement
      // sans qu'aucun appelant réel de l'app n'ait jamais pensé à passer
      // `retry` explicitement (mécanisme déjà écrit dans
      // BaseHttpService.executeWithRetry, jamais réellement invoqué).
      // Sûr par défaut sur GET, contrairement à POST/PATCH/DELETE
      // (non-idempotents) qui restent opt-in.
      retry = { attempts: 3, delay: 1000, exponentialBackoff: true },
      fallback,
      // Nouvelles options d'authentification
      authConfig,
      withCredentials = false,
      cookieNames = [],
      multiTenant = false
    } = config;

    // `cache` fait double emploi (déjà le cas avant ce correctif) : mode
    // natif passé tel quel à `fetch()` ET flag pour le cache applicatif
    // ci-dessous. 'no-cache'/'no-store'/'reload' expriment tous les
    // trois une intention appelante de "je veux une réponse fraîche" :
    // on respecte ça en désactivant LECTURE et ÉCRITURE du cache
    // applicatif dans ces trois cas (pas seulement 'no-cache' comme
    // avant ce correctif).
    const bypassAppCache = cache === 'no-cache' || cache === 'no-store' || cache === 'reload';

    try {
      // Construire l'URL avec les paramètres
      const sanitizedParams = sanitize && params ? RequestSanitizer.sanitizeParams(params) : params;
      const fullUrl = UrlBuilder.buildUrl(this.baseUrl, endpoint, sanitizedParams);

      // Clé incluant la liste de tenants RÉELLEMENT envoyée (tenant
      // courant + tenants publics, voir generateCacheKey ci-dessous) et
      // le token d'accès courant (ou 'anon' en son absence) --
      // indispensable en multi-tenant : sans ça, deux tenants (ou deux
      // utilisateurs successifs dans le même onglet) partageraient les
      // mêmes entrées de cache pour un même endpoint, avec fuite de
      // données de l'un vers l'autre. Le token n'est ajouté qu'à la clé,
      // jamais persisté ailleurs ni exposé.
      const cacheKey = this.generateCacheKey(fullUrl, headers, multiTenant);

      if (!bypassAppCache) {
        const cachedData = getCacheStore.get(cacheKey);
        if (cachedData !== undefined) {
          return {
            data: cachedData as TResponse,
            status: 200,
            headers: new Headers(),
            cached: true
          };
        }
      }

      // Requêtes identiques déjà en vol : on attend la même promesse au
      // lieu de redéclencher un appel réseau redondant (voir `inFlight`
      // ci-dessus). Fait AVANT le fetch, jamais après, pour couvrir le
      // cas qu'il cible : deux appelants qui arrivent quasi simultanément.
      let fetchPromise = this.inFlight.get(cacheKey);
      if (!fetchPromise) {
        fetchPromise = (async () => {
          // Construire les headers avec authentification complète
          const requestHeaders = await this.buildGetHeaders(headers, requireAuth, authConfig, cookieNames);

          // Exécuter la requête avec retry -- l'AbortController est recréé à
          // CHAQUE tentative (à l'intérieur de la closure), pas une seule
          // fois avant la boucle : sinon, après un premier timeout, le
          // signal reste définitivement "aborted" et toutes les tentatives
          // suivantes échouent instantanément sans jamais réessayer pour de
          // vrai -- ce qui aurait rendu le retry inutile face à un cold
          // start Render (le service peut mettre 30-60s à se réveiller après
          // une période d'inactivité), pourtant le cas qu'il doit couvrir.
          const response = await this.executeWithRetry(() => {
            const controller = this.createAbortController(timeout);
            const fetchConfig: RequestInit = {
              method: 'GET',
              headers: requestHeaders,
              signal: controller.signal,
              cache,
              // Support des cookies
              credentials: withCredentials ? 'include' : 'same-origin',
            };
            return fetch(fullUrl, fetchConfig);
          }, retry);

          const rawData = await this.handleResponse(response, endpoint);
          return { data: rawData, status: response.status, headers: response.headers };
        })();

        this.inFlight.set(cacheKey, fetchPromise);
        // Effet de bord uniquement (nettoyage de la map) : on ignore
        // volontairement la promesse renvoyée par `.finally()` pour ne
        // jamais avoir deux objets-promesse distincts en circulation
        // pour le même appel (celui stocké dans `inFlight` et celui
        // utilisé localement ci-dessous doivent rester le MÊME objet).
        void fetchPromise.finally(() => {
          if (this.inFlight.get(cacheKey) === fetchPromise) {
            this.inFlight.delete(cacheKey);
          }
        });
      }

      const { data: rawData, status, headers: responseHeaders } = await fetchPromise;

      // Réforme multi-tenant (voir services/api/utils/tenantEnvelope.ts) :
      // par défaut, on replie l'enveloppe `[{tenant, statusCode, data}]`
      // sur le tenant PRINCIPAL -- `schema`/`transform` ci-dessous restent
      // écrits pour la forme "sans enveloppe", sans aucun changement pour
      // la quasi-totalité des appels existants. `multiTenant: true` laisse
      // passer l'enveloppe brute pour l'appelant qui la demande explicitement.
      const scopedData = multiTenant ? rawData : unwrapToPrimaryTenant(rawData);

      // Transformer les données si nécessaire
      const processedData = transform ? transform(scopedData) : scopedData;

      // Valider avec Zod
      const validatedData = await this.validateData(schema, processedData, endpoint);

      // Mettre en cache (TTL explicite via `revalidate`, sinon défaut --
      // voir DEFAULT_GET_CACHE_TTL_SECONDS ; `revalidate: 0` désactive
      // explicitement la mise en cache pour cet appel sans désactiver le
      // partage `inFlight` ci-dessus).
      if (!bypassAppCache) {
        const ttlSeconds = revalidate ?? DEFAULT_GET_CACHE_TTL_SECONDS;
        if (ttlSeconds > 0) {
          getCacheStore.set(cacheKey, validatedData, ttlSeconds * 1000);
        }
      }

      return {
        data: validatedData as TResponse,
        status,
        headers: responseHeaders,
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

  private async buildGetHeaders(
    headers: Record<string, string>,
    requireAuth: boolean,
    authConfig?: AuthConfig,
    cookieNames: string[] = []
  ): Promise<Record<string, string>> {
    const requestHeaders: Record<string, string> = { ...this.defaultHeaders, ...headers };

    if (requireAuth || authConfig) {
      await this.addAuthenticationHeaders(requestHeaders, authConfig);
    } else {
      // Propagation OPPORTUNISTE du token même sur une route publique
      // (requireAuth=false, ex: liste des News/Commentaires — lecture
      // publique par design côté backend, voir config/config.py:
      // TENANT_PUBLIC_ROUTES). Le backend authentifie quand même le
      // Bearer token s'il est présent (JWTAuthentication est dans
      // DEFAULT_AUTHENTICATION_CLASSES, indépendamment du classement
      // de route) pour personnaliser la réponse (userReaction,
      // userVoteStatus, userReactions...). Sans cet envoi, un
      // utilisateur connecté était traité comme anonyme sur TOUTES les
      // lectures publiques, faute de header Authorization.
      const token = this.getToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
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

  private generateCacheKey(url: string, headers: HeadersInit, multiTenant: boolean): string {
    // Liste EFFECTIVEMENT envoyée dans X-Tenant-Domain, pas seulement le
    // tenant courant : ce service ne fait QUE des GET, et depuis la
    // réforme multi-tenant (voir authFetchInterceptor.ts), TOUT GET
    // porte la liste combinée tenant courant + tenants is_public=true
    // (store/tenants.store.ts::getTenantHeaderListValue) -- utiliser ici
    // le seul tenant courant sous-fragmenterait le cache : deux appels
    // avec des listes de tenants publics différentes (ex: la liste
    // vient de se rafraîchir entretemps, voir refreshPublicTenants())
    // partageraient à tort la même entrée. `multiTenant` distingue en
    // plus la forme de réponse : un même endpoint appelé une fois avec
    // `multiTenant: true` (enveloppe brute) et une fois sans (repli sur
    // le tenant principal) ne doivent jamais se marcher dessus.
    const tenants = getTenantHeaderListValue() ?? '__no_tenant__';
    const authIdentity = this.getToken() ?? '__anon__';
    const headersString = JSON.stringify(headers);
    return `${tenants}::${multiTenant ? 'envelope' : 'primary'}::${authIdentity}::${url}::${headersString}`;
  }

  private async validateData<T>(
    schema: z.ZodSchema<T> | undefined,
    data: unknown,
    endpoint: string
  ): Promise<T> {
    if (!schema) return data as T;
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
   * Vide le cache applicatif partagé (voir cache/getCache.ts). Public
   * pour un reset manuel ponctuel ; l'invalidation courante se fait
   * automatiquement après toute mutation réussie, voir
   * authFetchInterceptor.ts.
   */
  public clearCache(): void {
    getCacheStore.clear();
  }

  /**
   * Statistiques du cache applicatif partagé (debug uniquement).
   */
  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: getCacheStore.size,
      keys: getCacheStore.keys()
    };
  }
}