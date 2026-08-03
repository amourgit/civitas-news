// services/UpdateService.ts
import { BaseHttpService } from "./base/BaseHttpService";
import { OptimisticUpdateMetadata } from "../types/update.types";
import { ConflictResolutionStrategy } from "../types/update.types";
import { PutRequestConfig } from "../types/update.types";
import { ApiResponse } from "../types/http.types";
import { RequestSanitizer } from "../utils/sanitizer";
import { UrlBuilder } from "../utils/urlBuilder";
import { ApiError } from "../errors/ApiError";
import { ValidationError } from "../errors/ApiError";
import { NetworkError } from "../errors/ApiError";
import { z } from "zod";
import { ConflictError } from "../errors/UpdateError";
import { PatchRequestConfig } from "../types/update.types";
import { BulkUpdateConfig } from "../types/update.types";
import { ConflictInfo } from "../types/update.types";

export class UpdateService extends BaseHttpService {
    private readonly optimisticUpdates = new Map<string, OptimisticUpdateMetadata>();
    private readonly conflictStrategies = new Map<string, ConflictResolutionStrategy>();
    private readonly versionCache = new Map<string, string>();
  
    /**
     * Requête PUT pour remplacement complet de ressource
     */
    async put<TRequest, TResponse>(
      config: PutRequestConfig<TRequest, TResponse>
    ): Promise<ApiResponse<TResponse>> {
      const {
        endpoint,
        resourceId,
        body,
        bodySchema,
        responseSchema,
        params,
        headers = {},
        transform,
        timeout = this.defaultTimeout,
        requireAuth = false,
        sanitize = true,
        validateRequest = true,
        optimisticUpdate = false,
        conflictResolution = 'server',
        etag,
        lastModified,
        replaceStrategy = 'full',
        retry,
        fallback
      } = config;
  
      try {
        // Construire l'endpoint avec l'ID
        const resourceEndpoint = this.buildResourceEndpoint(endpoint, resourceId);
  
        // Validation du body
        const validatedBody = validateRequest && bodySchema
          ? await this.validateRequestBody(bodySchema, body, resourceEndpoint)
          : body;
  
        // Sanitisation
        const sanitizedBody = sanitize ? this.sanitizeRequestBody(validatedBody) : validatedBody;
  
        // Gestion optimistic update
        const optimisticId = optimisticUpdate 
          ? await this.handleOptimisticUpdate(resourceEndpoint, resourceId, sanitizedBody, 'PUT')
          : null;
  
        // Construire l'URL complète
        const sanitizedParams = sanitize && params ? RequestSanitizer.sanitizeParams(params) : params;
        const fullUrl = UrlBuilder.buildUrl(this.baseUrl, resourceEndpoint, sanitizedParams);
  
        // Headers avec gestion des conflits
        const requestHeaders = await this.buildUpdateHeaders(
          headers,
          requireAuth,
          etag,
          lastModified
        );
  
        // AbortController
        const controller = this.createAbortController(timeout);
  
        // Stratégie de remplacement
        const requestBody = replaceStrategy === 'merge' 
          ? await this.mergeWithExisting(fullUrl, sanitizedBody, requestHeaders)
          : sanitizedBody;
  
        // Exécution avec retry
        const response = await this.executeWithRetry(
          () => this.executePutRequest(
            fullUrl,
            requestBody,
            requestHeaders,
            controller
          ),
          retry
        );
  
        // Gestion des conflits
        if (response.status === 409) {
          return this.handleConflict(
            response,
            config,
            conflictResolution,
            optimisticId
          );
        }
  
        // Traitement de la réponse
        const rawData = await this.handleResponse(response, resourceEndpoint);
        const processedData = transform ? transform(rawData) : rawData;
        const validatedData = await this.validateData(responseSchema, processedData, resourceEndpoint);
  
        // Nettoyer optimistic update
        if (optimisticId) {
          this.optimisticUpdates.delete(optimisticId);
        }
  
        // Mettre à jour le cache de version
        this.updateVersionCache(resourceEndpoint, response);
  
        return {
          data: validatedData,
          status: response.status,
          headers: response.headers,
          cached: false
        };
  
      } catch (error) {
        await this.handleUpdateError(error, config.resourceId, optimisticUpdate);
        
        if (fallback !== undefined && this.shouldUseFallback(error)) {
          return {
            data: fallback as TResponse,
            status: 200,
            headers: new Headers(),
            cached: false
          };
        }
  
        throw this.processError(error, endpoint);
      }
    }
  
    /**
     * Requête PATCH pour mise à jour partielle
     */
    async patch<TRequest, TResponse>(
      config: PatchRequestConfig<TRequest, TResponse>
    ): Promise<ApiResponse<TResponse>> {
      const {
        endpoint,
        resourceId,
        patches,
        patchSchema,
        responseSchema,
        params,
        headers = {},
        transform,
        timeout = this.defaultTimeout,
        requireAuth = false,
        sanitize = true,
        validatePatches = true,
        optimisticUpdate = false,
        conflictResolution = 'server',
        etag,
        lastModified,
        patchFormat = 'merge-patch',
        retry,
        fallback
      } = config;
  
      try {
        // Construire l'endpoint
        const resourceEndpoint = this.buildResourceEndpoint(endpoint, resourceId);
  
        // Validation des patches
        const validatedPatches = validatePatches && patchSchema
          ? await this.validateRequestBody(patchSchema, patches, resourceEndpoint)
          : patches;
  
        // Formatage selon le type de patch
        const formattedPatches = await this.formatPatches(
          validatedPatches,
          patchFormat,
          sanitize
        );
  
        // Optimistic update
        const optimisticId = optimisticUpdate
          ? await this.handleOptimisticUpdate(resourceEndpoint, resourceId, formattedPatches, 'PATCH')
          : null;
  
        // URL complète
        const sanitizedParams = sanitize && params ? RequestSanitizer.sanitizeParams(params) : params;
        const fullUrl = UrlBuilder.buildUrl(this.baseUrl, resourceEndpoint, sanitizedParams);
  
        // Headers spécifiques au PATCH
        const requestHeaders = await this.buildPatchHeaders(
          headers,
          requireAuth,
          patchFormat,
          etag,
          lastModified
        );
  
        // AbortController
        const controller = this.createAbortController(timeout);
  
        // Exécution
        const response = await this.executeWithRetry(
          () => this.executePatchRequest(
            fullUrl,
            formattedPatches,
            requestHeaders,
            controller
          ),
          retry
        );
  
        // Gestion des conflits
        if (response.status === 409) {
          return this.handleConflict(
            response,
            config as any,
            conflictResolution,
            optimisticId
          );
        }
  
        // Traitement réponse
        const rawData = await this.handleResponse(response, resourceEndpoint);
        const processedData = transform ? transform(rawData) : rawData;
        const validatedData = await this.validateData(responseSchema, processedData, resourceEndpoint);
  
        // Nettoyage
        if (optimisticId) {
          this.optimisticUpdates.delete(optimisticId);
        }
  
        this.updateVersionCache(resourceEndpoint, response);
  
        return {
          data: validatedData,
          status: response.status,
          headers: response.headers,
          cached: false
        };
  
      } catch (error) {
        await this.handleUpdateError(error, config.resourceId, optimisticUpdate);
        
        if (fallback !== undefined && this.shouldUseFallback(error)) {
          return {
            data: fallback as TResponse,
            status: 200,
            headers: new Headers(),
            cached: false
          };
        }
  
        throw this.processError(error, endpoint);
      }
    }
  
    /**
     * Mise à jour en lot (bulk update)
     */
    async bulkUpdate<TRequest, TResponse>(
      config: BulkUpdateConfig<TRequest, TResponse>
    ): Promise<ApiResponse<Array<{ id: string | number; data: TResponse | null; error?: Error }>>> {
      const {
        endpoint,
        updates,
        bodySchema,
        responseSchema,
        batchSize = 10,
        concurrent = true,
        stopOnError = false,
        onProgress,
        timeout = this.defaultTimeout,
        requireAuth = false
      } = config;
  
      try {
        const results: Array<{ id: string | number; data: TResponse | null; error?: Error }> = [];
        const errors: Error[] = [];
        const batches = this.createBatches(updates, batchSize);
  
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          const batchPromises = batch.map(async (update) => {
            try {
              const method = update.method || 'PATCH';
              const response = method === 'PUT'
                ? await this.put({
                    endpoint,
                    resourceId: update.id,
                    body: update.data,
                    bodySchema,
                    responseSchema,
                    timeout,
                    requireAuth
                  })
                : await this.patch({
                    endpoint,
                    resourceId: update.id,
                    patches: update.data,
                    patchSchema: bodySchema,
                    responseSchema,
                    timeout,
                    requireAuth
                  });
  
              return { id: update.id, data: response.data, error: undefined };
            } catch (error) {
              const updateError = error as Error;
              errors.push(updateError);
              if (stopOnError) throw updateError;
              return { id: update.id, data: null, error: updateError };
            }
          });
  
          const batchResults = concurrent
            ? await Promise.all(batchPromises)
            : await this.executeSequentially(batchPromises);
  
          results.push(...batchResults);
  
          if (onProgress) {
            onProgress(results.length, updates.length, errors);
          }
        }
  
        return {
          data: results,
          status: errors.length > 0 ? 207 : 200, // Multi-Status si erreurs
          headers: new Headers(),
          cached: false
        };
  
      } catch (error) {
        throw this.processError(error, endpoint);
      }
    }
  
    /**
     * Méthodes utilitaires simplifiées
     */
    async updateResource<TRequest, TResponse>(
      endpoint: string,
      resourceId: string | number,
      data: TRequest,
      responseSchema: z.ZodSchema<TResponse>,
      method: 'PUT' | 'PATCH' = 'PATCH'
    ): Promise<TResponse> {
      const response = method === 'PUT'
        ? await this.put({
            endpoint,
            resourceId,
            body: data,
            responseSchema
          })
        : await this.patch({
            endpoint,
            resourceId,
            patches: data,
            responseSchema
          });
  
      return response.data;
    }
  
    async updateWithOptimism<TRequest, TResponse>(
      endpoint: string,
      resourceId: string | number,
      data: TRequest,
      responseSchema: z.ZodSchema<TResponse>
    ): Promise<TResponse> {
      const response = await this.patch({
        endpoint,
        resourceId,
        patches: data,
        responseSchema,
        optimisticUpdate: true
      });
  
      return response.data;
    }
  
    async safeUpdate<TRequest, TResponse>(
      endpoint: string,
      resourceId: string | number,
      data: TRequest,
      responseSchema: z.ZodSchema<TResponse>,
      etag?: string
    ): Promise<TResponse> {
      const response = await this.put({
        endpoint,
        resourceId,
        body: data,
        responseSchema,
        etag,
        conflictResolution: 'client'
      });
  
      return response.data;
    }
  
    // Méthodes privées pour la logique interne
    private buildResourceEndpoint(endpoint: string, resourceId: string | number): string {
      // Vérifier si l'endpoint contient déjà un placeholder ou un ID
      if (endpoint.includes(':id')) {
        return endpoint.replace(':id', String(resourceId));
      }
      
      if (endpoint.includes('{id}')) {
        return endpoint.replace('{id}', String(resourceId));
      }
  
      // Sinon, ajouter l'ID à la fin
      return `${endpoint.replace(/\/$/, '')}/${resourceId}`;
    }
  
    private async handleOptimisticUpdate(
      endpoint: string,
      resourceId: string | number,
      data: unknown,
      method: 'PUT' | 'PATCH'
    ): Promise<string> {
      const optimisticId = `${method.toLowerCase()}_${endpoint}_${resourceId}_${Date.now()}`;
      
      // Récupérer les données actuelles (simulé)
      const originalData = await this.getCurrentData(endpoint, resourceId);
      
      // Calculer les données optimistes
      const optimisticData = method === 'PUT' ? data : { ...originalData, ...data };
      
      // Stocker dans le cache optimiste
      this.optimisticUpdates.set(optimisticId, {
        id: optimisticId,
        resourceId,
        originalData,
        optimisticData,
        timestamp: Date.now(),
        rollbackFn: () => {
          // Logique de rollback - à implémenter selon votre store
          console.log(`Rollback optimistic update for ${resourceId}`);
        }
      });
  
      return optimisticId;
    }
  
    private async getCurrentData(endpoint: string, resourceId: string | number): Promise<unknown> {
      // Cette méthode devrait récupérer les données actuelles
      // Peut utiliser le GetService ou un cache local
      try {
        const getService = new (await import('./GetService')).GetService(this.baseUrl);
        return await getService.getSimple(
          this.buildResourceEndpoint(endpoint, resourceId),
          z.any()
        );
      } catch {
        return {};
      }
    }
  
    private async buildUpdateHeaders(
      headers: HeadersInit,
      requireAuth: boolean,
      etag?: string,
      lastModified?: string
    ): Promise<HeadersInit> {
      const requestHeaders = { ...this.defaultHeaders, ...headers };
  
      if (requireAuth) {
        const token = await this.getAuthToken();
        if (token) {
          (requestHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }
      }
  
      // Headers pour la gestion des conflits
      if (etag) {
        (requestHeaders as Record<string, string>)['If-Match'] = etag;
      }
  
      if (lastModified) {
        (requestHeaders as Record<string, string>)['If-Unmodified-Since'] = lastModified;
      }
  
      return requestHeaders;
    }
  
    private async buildPatchHeaders(
      headers: HeadersInit,
      requireAuth: boolean,
      patchFormat: string,
      etag?: string,
      lastModified?: string
    ): Promise<HeadersInit> {
      const baseHeaders = await this.buildUpdateHeaders(headers, requireAuth, etag, lastModified);
      
      // Content-Type spécifique selon le format de patch
      const contentType = patchFormat === 'json-patch' 
        ? 'application/json-patch+json'
        : patchFormat === 'merge-patch'
        ? 'application/merge-patch+json'
        : 'application/json';
  
      return {
        ...baseHeaders,
        'Content-Type': contentType
      };
    }
  
    private async formatPatches(
      patches: unknown,
      format: string,
      sanitize: boolean
    ): Promise<unknown> {
      if (sanitize) {
        patches = this.sanitizeRequestBody(patches);
      }
  
      switch (format) {
        case 'json-patch':
          return this.convertToJsonPatch(patches);
        case 'merge-patch':
          return patches; // Déjà au bon format
        case 'custom':
          return this.applyCustomPatchFormat(patches);
        default:
          return patches;
      }
    }
  
    private convertToJsonPatch(data: unknown): JsonPatchOperation[] {
      // Conversion simple - à améliorer selon vos besoins
      if (Array.isArray(data)) {
        return data as JsonPatchOperation[];
      }
  
      const operations: JsonPatchOperation[] = [];
      if (typeof data === 'object' && data !== null) {
        Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
          operations.push({
            op: 'replace',
            path: `/${key}`,
            value
          });
        });
      }
  
      return operations;
    }
  
    private applyCustomPatchFormat(data: unknown): unknown {
      // Logique personnalisée pour votre format de patch
      return data;
    }
  
    private async mergeWithExisting(
      url: string,
      newData: unknown,
      headers: HeadersInit
    ): Promise<unknown> {
      try {
        // Récupérer les données existantes
        const currentResponse = await fetch(url, {
          method: 'GET',
          headers: { ...headers, 'Content-Type': undefined } as HeadersInit
        });
  
        if (currentResponse.ok) {
          const currentData = await currentResponse.json();
          return { ...currentData, ...newData };
        }
      } catch (error) {
        console.warn('Could not merge with existing data:', error);
      }
  
      return newData;
    }
  
    private async executePutRequest(
      url: string,
      body: unknown,
      headers: HeadersInit,
      controller: AbortController
    ): Promise<Response> {
      return fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
    }
  
    private async executePatchRequest(
      url: string,
      patches: unknown,
      headers: HeadersInit,
      controller: AbortController
    ): Promise<Response> {
      return fetch(url, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(patches),
        signal: controller.signal
      });
    }
  
    private async handleConflict<TRequest, TResponse>(
      response: Response,
      config: PutRequestConfig<TRequest, TResponse> | PatchRequestConfig<TRequest, TResponse>,
      strategy: string,
      optimisticId?: string | null
    ): Promise<ApiResponse<TResponse>> {
      const serverData = await response.json().catch(() => ({}));
      const conflictInfo: ConflictInfo = {
        endpoint: config.endpoint,
        resourceId: config.resourceId,
        clientEtag: config.etag,
        serverEtag: response.headers.get('ETag') || undefined
      };
  
      // Rollback optimistic update
      if (optimisticId && this.optimisticUpdates.has(optimisticId)) {
        const optimisticData = this.optimisticUpdates.get(optimisticId)!;
        optimisticData.rollbackFn();
        this.optimisticUpdates.delete(optimisticId);
      }
  
      switch (strategy) {
        case 'client':
          throw new ConflictError('Resource modified by another process', conflictInfo, serverData);
        
        case 'server':
          // Accepter les données du serveur
          const validatedServerData = await this.validateData(
            config.responseSchema,
            serverData,
            config.endpoint
          );
          return {
            data: validatedServerData,
            status: 200,
            headers: response.headers,
            cached: false
          };
        
        case 'merge':
          return this.attemptMerge(config, serverData, conflictInfo);
        
        default:
          throw new ConflictError('Resource conflict', conflictInfo, serverData);
      }
    }
  
    private async attemptMerge<TRequest, TResponse>(
      config: PutRequestConfig<TRequest, TResponse> | PatchRequestConfig<TRequest, TResponse>,
      serverData: unknown,
      conflictInfo: ConflictInfo
    ): Promise<ApiResponse<TResponse>> {
      try {
        const clientData = 'body' in config ? config.body : config.patches;
        const mergedData = { ...serverData, ...clientData };
        
        // Re-tenter la mise à jour avec les données fusionnées
        const newEtag = conflictInfo.serverEtag;
        
        if ('body' in config) {
          return this.put({
            ...config,
            body: mergedData as TRequest,
            etag: newEtag,
            conflictResolution: 'client' // Éviter boucle infinie
          });
        } else {
          return this.patch({
            ...config,
            patches: mergedData as TRequest,
            etag: newEtag,
            conflictResolution: 'client'
          });
        }
      } catch (error) {
        throw new ConflictError('Merge failed', conflictInfo, serverData);
      }
    }
  
    private updateVersionCache(endpoint: string, response: Response): void {
      const etag = response.headers.get('ETag');
      if (etag) {
        this.versionCache.set(endpoint, etag);
      }
    }
  
    private async handleUpdateError(
      error: unknown,
      resourceId: string | number,
      optimisticUpdate: boolean
    ): Promise<void> {
      if (optimisticUpdate) {
        // Rollback tous les optimistic updates pour cette ressource
        for (const [id, metadata] of this.optimisticUpdates.entries()) {
          if (metadata.resourceId === resourceId) {
            metadata.rollbackFn();
            this.optimisticUpdates.delete(id);
          }
        }
      }
    }
  
    private createBatches<T>(items: T[], batchSize: number): T[][] {
      const batches: T[][] = [];
      for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize));
      }
      return batches;
    }
  
    private async executeSequentially<T>(promises: Promise<T>[]): Promise<T[]> {
      const results: T[] = [];
      for (const promise of promises) {
        results.push(await promise);
      }
      return results;
    }
  
    // Méthodes utilitaires héritées
    private sanitizeRequestBody(body: unknown): unknown {
      if (typeof body === 'object' && body !== null) {
        return RequestSanitizer.sanitizeParams(body as Record<string, unknown>);
      }
      return body;
    }
  
    private async validateRequestBody<T>(
      schema: z.ZodSchema<T>,
      body: T,
      endpoint: string
    ): Promise<T> {
      try {
        return await schema.parseAsync(body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ValidationError(
            'Request body validation failed',
            error.issues,
            endpoint
          );
        }
        throw error;
      }
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
      if (error instanceof ApiError || error instanceof ValidationError || error instanceof ConflictError) {
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
  
    private async getAuthToken(): Promise<string | null> {
      if (typeof window !== 'undefined') {
        return this.getToken();
      }
      return null;
    }
  
    /**
     * Méthodes de gestion publiques
     */
    public getOptimisticUpdates(): OptimisticUpdateMetadata[] {
      return Array.from(this.optimisticUpdates.values());
    }
  
    public rollbackOptimisticUpdate(optimisticId: string): boolean {
      const update = this.optimisticUpdates.get(optimisticId);
      if (update) {
        update.rollbackFn();
        this.optimisticUpdates.delete(optimisticId);
        return true;
      }
      return false;
    }
  
    public rollbackAllOptimistic(resourceId?: string | number): void {
      for (const [id, metadata] of this.optimisticUpdates.entries()) {
        if (!resourceId || metadata.resourceId === resourceId) {
          metadata.rollbackFn();
          this.optimisticUpdates.delete(id);
        }
      }
    }
  
    public getVersionCache(): Map<string, string> {
      return new Map(this.versionCache);
    }
  
    public clearVersionCache(): void {
      this.versionCache.clear();
    }
  
    public registerConflictStrategy(
      endpoint: string,
      strategy: ConflictResolutionStrategy
    ): void {
      this.conflictStrategies.set(endpoint, strategy);
    }
  }