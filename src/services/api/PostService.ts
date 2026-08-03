// services/PostService.ts
import { BaseHttpService } from "./base/BaseHttpService";
import { BatchRequestConfig, FileUploadConfig, PostRequestConfig } from "../types/post.types";
import { ApiResponse, RetryConfig } from "../types/http.types";
import { RequestSanitizer } from "../utils/sanitizer";
import { UrlBuilder } from "../utils/urlBuilder";
import { ApiError } from "../errors/ApiError";
import { ValidationError } from "../errors/ApiError";
import { NetworkError } from "../errors/ApiError";
import { z } from "zod";


export class PostService extends BaseHttpService {
    private readonly pendingRequests = new Map<string, Promise<ApiResponse<unknown>>>();
    private readonly optimisticCache = new Map<string, { data: unknown; timestamp: number }>();
  
    /**
     * Requête POST standard avec validation complète
     */
    async post<TRequest, TResponse>(
      config: PostRequestConfig<TRequest, TResponse>
    ): Promise<ApiResponse<TResponse>> {
      const {
        endpoint,
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
        idempotencyKey,
        retry,
        fallback
      } = config;
  
      try {
        // Validation du body si demandée
        const validatedBody = validateRequest && bodySchema 
          ? await this.validateRequestBody(bodySchema, body, endpoint)
          : body;
  
        // Sanitisation si nécessaire
        const sanitizedBody = sanitize ? this.sanitizeRequestBody(validatedBody) : validatedBody;
  
        // Gestion de l'optimistic update
        const optimisticId = optimisticUpdate ? this.generateOptimisticId(endpoint, sanitizedBody) : null;
        if (optimisticUpdate && optimisticId) {
          this.setOptimisticData(optimisticId, sanitizedBody);
        }
  
        // Construire l'URL
        const sanitizedParams = sanitize && params ? RequestSanitizer.sanitizeParams(params) : params;
        const fullUrl = UrlBuilder.buildUrl(this.baseUrl, endpoint, sanitizedParams);
  
        // Gestion de l'idempotency
        const requestKey = idempotencyKey || this.generateRequestKey(fullUrl, sanitizedBody);
        
        // Vérifier si une requête identique est en cours
        if (this.pendingRequests.has(requestKey)) {
          return this.pendingRequests.get(requestKey) as Promise<ApiResponse<TResponse>>;
        }
  
        // Construire les headers
        const requestHeaders = await this.buildPostHeaders(headers, requireAuth, idempotencyKey);
  
        // Créer l'AbortController
        const controller = this.createAbortController(timeout);
  
        // Créer la promesse de requête
        const requestPromise = this.executePostRequest<TResponse>(
          fullUrl,
          sanitizedBody,
          requestHeaders,
          controller,
          responseSchema,
          transform,
          retry,
          endpoint
        );
  
        // Stocker la requête en cours
        this.pendingRequests.set(requestKey, requestPromise);
  
        // Nettoyer après la requête
        const result = await requestPromise;
        this.pendingRequests.delete(requestKey);
  
        // Nettoyer l'optimistic update en cas de succès
        if (optimisticId) {
          this.optimisticCache.delete(optimisticId);
        }
  
        return result;
  
      } catch (error) {
        // Nettoyer en cas d'erreur
        const requestKey = idempotencyKey || this.generateRequestKey(endpoint, body);
        this.pendingRequests.delete(requestKey);
  
        // Gestion du fallback
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
     * Upload de fichiers avec support multi-fichiers
     */
    async uploadFiles<TResponse>(
      config: FileUploadConfig<TResponse>
    ): Promise<ApiResponse<TResponse>> {
      const {
        endpoint,
        files,
        fieldName = 'files',
        additionalFields = {},
        params,
        timeout = 30000, // Timeout plus long pour les uploads
        requireAuth = false,
        responseSchema,
        maxFileSize,
        allowedTypes,
        onProgress,
        retry
      } = config;
  
      try {
        // Validation des fichiers
        const fileArray = Array.from(files);
        this.validateFiles(fileArray, maxFileSize, allowedTypes);
  
        // Construire FormData
        const formData = new FormData();
        
        fileArray.forEach((file, index) => {
          const name = fileArray.length > 1 ? `${fieldName}[${index}]` : fieldName;
          formData.append(name, file);
        });
  
        // Ajouter les champs additionnels
        Object.entries(additionalFields).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
  
        // Construire l'URL
        const fullUrl = UrlBuilder.buildUrl(this.baseUrl, endpoint, params);
  
        // Headers pour upload (pas de Content-Type, le navigateur le gère)
        const headers = await this.buildUploadHeaders(requireAuth);
  
        // AbortController avec timeout étendu
        const controller = this.createAbortController(timeout);
  
        // Exécuter l'upload avec retry
        const response = await this.executeWithRetry(
          () => this.executeUploadRequest(fullUrl, formData, headers, controller, onProgress),
          retry
        );
  
        // Traiter la réponse
        const rawData = await this.handleResponse(response, endpoint);
        const processedData = rawData;
        const validatedData = await this.validateData(responseSchema, processedData, endpoint);
  
        return {
          data: validatedData,
          status: response.status,
          headers: response.headers,
          cached: false
        };
  
      } catch (error) {
        throw this.processError(error, endpoint);
      }
    }
  
    /**
     * Requêtes POST en lot (batch)
     */
    async postBatch<TRequest, TResponse>(
      config: BatchRequestConfig<TRequest, TResponse>
    ): Promise<ApiResponse<TResponse[]>> {
      const {
        endpoint,
        requests,
        bodySchema,
        responseSchema,
        batchSize = 5,
        concurrent = false,
        stopOnError = false,
        onBatchProgress,
        timeout = this.defaultTimeout,
        requireAuth = false
      } = config;
  
      try {
        const results: TResponse[] = [];
        const errors: Error[] = [];
        const batches = this.createBatches(requests, batchSize);
  
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          const batchPromises = batch.map(request => 
            this.post({
              endpoint,
              body: request,
              bodySchema,
              responseSchema,
              timeout,
              requireAuth
            }).then(response => response.data)
            .catch(error => {
              errors.push(error);
              if (stopOnError) throw error;
              return null;
            })
          );
  
          const batchResults = concurrent 
            ? await Promise.all(batchPromises)
            : await this.executeSequentially(batchPromises);
  
          results.push(...batchResults.filter(result => result !== null));
          
          // Callback de progression
          if (onBatchProgress) {
            onBatchProgress(results.length, requests.length);
          }
        }
  
        // Si des erreurs et stopOnError est false, les logger
        if (errors.length > 0 && !stopOnError) {
          console.warn(`Batch completed with ${errors.length} errors:`, errors);
        }
  
        return {
          data: results,
          status: 207, // Multi-Status
          headers: new Headers(),
          cached: false
        };
  
      } catch (error) {
        throw this.processError(error, endpoint);
      }
    }
  
    /**
     * Méthodes utilitaires simples
     */
    async postSimple<TRequest, TResponse>(
      endpoint: string,
      body: TRequest,
      responseSchema: z.ZodSchema<TResponse>,
      bodySchema?: z.ZodSchema<TRequest>
    ): Promise<TResponse> {
      const response = await this.post({
        endpoint,
        body,
        bodySchema,
        responseSchema
      });
      return response.data;
    }
  
    async createResource<TRequest, TResponse>(
      endpoint: string,
      data: TRequest,
      responseSchema: z.ZodSchema<TResponse>
    ): Promise<TResponse> {
      return this.postSimple(endpoint, data, responseSchema);
    }
  
    async submitForm<TFormData, TResponse>(
      endpoint: string,
      formData: TFormData,
      responseSchema: z.ZodSchema<TResponse>,
      optimistic: boolean = false
    ): Promise<TResponse> {
      const response = await this.post({
        endpoint,
        body: formData,
        responseSchema,
        optimisticUpdate: optimistic
      });
      return response.data;
    }
  
    // Méthodes privées pour la logique interne
    private async executePostRequest<TResponse>(
      url: string,
      body: unknown,
      headers: HeadersInit,
      controller: AbortController,
      responseSchema: z.ZodSchema<TResponse>,
      transform?: (data: unknown) => TResponse,
      retry?: RetryConfig,
      endpoint?: string
    ): Promise<ApiResponse<TResponse>> {
      const response = await this.executeWithRetry(
        () => fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: controller.signal
        }),
        retry
      );
  
      const rawData = await this.handleResponse(response, endpoint || url);
      const processedData = transform ? transform(rawData) : rawData;
      const validatedData = await this.validateData(responseSchema, processedData, endpoint || url);
  
      return {
        data: validatedData,
        status: response.status,
        headers: response.headers,
        cached: false
      };
    }
  
    private async executeUploadRequest(
      url: string,
      formData: FormData,
      headers: HeadersInit,
      controller: AbortController,
      onProgress?: (progress: ProgressEvent) => void
    ): Promise<Response> {
      if (onProgress && 'XMLHttpRequest' in globalThis) {
        // Utiliser XMLHttpRequest pour le suivi de progression
        return new Promise<Response>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener('progress', onProgress);
          
          xhr.onload = () => {
            const response = new Response(xhr.response, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: new Headers()
            });
            resolve(response);
          };
          
          xhr.onerror = () => reject(new NetworkError('Upload failed'));
          xhr.ontimeout = () => reject(new NetworkError('Upload timeout'));
          
          xhr.open('POST', url);
          Object.entries(headers as Record<string, string>).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });
          
          controller.signal.addEventListener('abort', () => xhr.abort());
          
          xhr.send(formData);
        });
      } else {
        // Fallback vers fetch standard
        return fetch(url, {
          method: 'POST',
          headers,
          body: formData,
          signal: controller.signal
        });
      }
    }
  
    private async executeSequentially<T>(promises: (() => Promise<T>)[]): Promise<T[]> {
      const results: T[] = [];
      for (const promiseFactory of promises) {
        results.push(await promiseFactory());
      }
      return results;
    }
  
    private createBatches<T>(items: T[], batchSize: number): T[][] {
      const batches: T[][] = [];
      for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize));
      }
      return batches;
    }
  
    private validateFiles(files: File[], maxFileSize?: number, allowedTypes?: string[]): void {
      files.forEach(file => {
        if (maxFileSize && file.size > maxFileSize) {
          throw new ValidationError(
            `File ${file.name} exceeds maximum size of ${maxFileSize} bytes`,
            []
          );
        }
        
        if (allowedTypes && !allowedTypes.includes(file.type)) {
          throw new ValidationError(
            `File ${file.name} has unsupported type ${file.type}`,
            []
          );
        }
      });
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
  
    private sanitizeRequestBody(body: unknown): unknown {
      if (typeof body === 'object' && body !== null) {
        return RequestSanitizer.sanitizeParams(body as Record<string, unknown>);
      }
      return body;
    }
  
    private generateOptimisticId(endpoint: string, body: unknown): string {
      return `optimistic_${endpoint}_${JSON.stringify(body)}_${Date.now()}`;
    }
  
    private setOptimisticData(id: string, data: unknown): void {
      this.optimisticCache.set(id, {
        data,
        timestamp: Date.now()
      });
    }
  
    private generateRequestKey(endpoint: string, body: unknown): string {
      return `${endpoint}_${JSON.stringify(body)}`;
    }
  
    private async buildPostHeaders(
      headers: HeadersInit,
      requireAuth: boolean,
      idempotencyKey?: string
    ): Promise<HeadersInit> {
      const requestHeaders = { ...this.defaultHeaders, ...headers };
  
      if (requireAuth) {
        const token = await this.getAuthToken();
        if (token) {
          (requestHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }
      }
  
      if (idempotencyKey) {
        (requestHeaders as Record<string, string>)['Idempotency-Key'] = idempotencyKey;
      }
  
      return requestHeaders;
    }
  
    private async buildUploadHeaders(requireAuth: boolean): Promise<HeadersInit> {
      const headers: Record<string, string> = {
        // Pas de Content-Type pour FormData, le navigateur le gère
      };
  
      if (requireAuth) {
        const token = await this.getAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
  
      return headers;
    }
  
    private async getAuthToken(): Promise<string | null> {
      if (typeof window !== 'undefined') {
        return this.getToken();
      }
      return null;
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
     * Nettoyage des caches et requêtes en cours
     */
    public clearPendingRequests(): void {
      this.pendingRequests.clear();
    }
  
    public clearOptimisticCache(): void {
      this.optimisticCache.clear();
    }
  
    public getPendingRequestsCount(): number {
      return this.pendingRequests.size;
    }
  }