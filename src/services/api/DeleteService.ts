// services/DeleteService.ts
import { BaseHttpService } from "./base/BaseHttpService";
import { OptimisticDeleteMetadata } from "../types/delete.types";
import { DeleteConfirmation } from "../types/delete.types";
import { ScheduledDeleteConfig } from "../types/delete.types";
import { DeletedResourceInfo } from "../types/delete.types";
import { DeleteRequestConfig } from "../types/delete.types";
import { ApiResponse } from "../types/http.types";
import { UrlBuilder } from "../utils/urlBuilder";
import { ApiError } from "../errors/ApiError";
import { DeleteError, DependencyError, PermissionDeniedError, ProtectedResourceError } from "../errors/DeleteError";
import { ValidationError } from "../errors/ValidatatorError";
import { NetworkError } from "../errors/NetworkError";




export class DeleteService extends BaseHttpService {
    private readonly optimisticDeletes = new Map<string, OptimisticDeleteMetadata>();
    private readonly confirmationTokens = new Map<string, DeleteConfirmation>();
    private readonly scheduledDeletes = new Map<string, ScheduledDeleteConfig>();
    private readonly deletedResources = new Map<string, DeletedResourceInfo>();
  
    /**
     * Suppression simple d'une ressource
     */
    async delete<TResponse = void>(
      config: DeleteRequestConfig<TResponse>
    ): Promise<ApiResponse<TResponse | void>> {
      const {
        endpoint,
        resourceId,
        params,
        headers = {},
        responseSchema,
        transform,
        timeout = this.defaultTimeout,
        requireAuth = false,
        optimisticDelete = false,
        confirmationToken,
        cascade = false,
        softDelete = false,
        forceDelete = false,
        backupBeforeDelete = false,
        reason,
        dependencies = [],
        retry
      } = config;
  
      try {
        // Construire l'endpoint
        const resourceEndpoint = resourceId 
          ? this.buildResourceEndpoint(endpoint, resourceId)
          : endpoint;
  
        // Vérifications pré-suppression
        await this.preDeleteChecks(resourceEndpoint, resourceId, forceDelete);
  
        // Backup si demandé
        let backupData: unknown = null;
        if (backupBeforeDelete) {
          backupData = await this.createBackup(resourceEndpoint, resourceId);
        }
  
        // Optimistic delete
        const optimisticId = optimisticDelete
          ? await this.handleOptimisticDelete(resourceEndpoint, resourceId, softDelete, backupData)
          : null;
  
        // Construire l'URL avec paramètres de suppression
        const deleteParams = this.buildDeleteParams(params, {
          cascade,
          softDelete,
          force: forceDelete,
          reason,
          confirmationToken
        });
  
        const fullUrl = UrlBuilder.buildUrl(this.baseUrl, resourceEndpoint, deleteParams);
  
        // Headers
        const requestHeaders = await this.buildDeleteHeaders(
          headers,
          requireAuth,
          confirmationToken,
          dependencies
        );
  
        // AbortController
        const controller = this.createAbortController(timeout);
  
        // Exécution avec retry
        const response = await this.executeWithRetry(
          () => this.executeDeleteRequest(fullUrl, requestHeaders, controller),
          retry
        );
  
        // Traitement de la réponse
        let responseData: TResponse | void = undefined;
        
        if (response.status !== 204) { // 204 No Content
          const rawData = await this.handleDeleteResponse(response, resourceEndpoint);
          responseData = rawData ? (transform ? transform(rawData) : rawData) : undefined;
          
          if (responseSchema && responseData !== undefined) {
            responseData = await this.validateData(responseSchema, responseData, resourceEndpoint);
          }
        }
  
        // Enregistrer les informations de suppression
        if (resourceId) {
          this.recordDeletion(resourceId, endpoint, softDelete, reason);
        }
  
        // Nettoyer optimistic delete
        if (optimisticId) {
          this.optimisticDeletes.delete(optimisticId);
        }
  
        return {
          data: responseData,
          status: response.status,
          headers: response.headers,
          cached: false
        };
  
      } catch (error) {
        await this.handleDeleteError(error, resourceId, optimisticDelete);
        throw this.processDeleteError(error, endpoint, resourceId);
      }
    }
  
    /**
     * Suppression en lot (bulk delete)
     */
    async bulkDelete<TResponse = void>(
      config: BulkDeleteConfig<TResponse>
    ): Promise<ApiResponse<Array<{ id: string | number; success: boolean; error?: Error; data?: TResponse }>>> {
      const {
        endpoint,
        resourceIds,
        responseSchema,
        batchSize = 10,
        concurrent = false,
        stopOnError = false,
        cascade = false,
        softDelete = false,
        onProgress,
        confirmationTokens,
        timeout = this.defaultTimeout,
        requireAuth = false
      } = config;
  
      try {
        const results: Array<{ id: string | number; success: boolean; error?: Error; data?: TResponse }> = [];
        const errors: Error[] = [];
        const batches = this.createBatches(resourceIds, batchSize);
  
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i];
          const batchPromises = batch.map(async (resourceId) => {
            try {
              const response = await this.delete({
                endpoint,
                resourceId,
                responseSchema,
                cascade,
                softDelete,
                confirmationToken: confirmationTokens?.get(resourceId),
                timeout,
                requireAuth
              });
  
              return { id: resourceId, success: true, data: response.data };
            } catch (error) {
              const deleteError = error as Error;
              errors.push(deleteError);
              if (stopOnError) throw deleteError;
              return { id: resourceId, success: false, error: deleteError };
            }
          });
  
          const batchResults = concurrent
            ? await Promise.all(batchPromises)
            : await this.executeSequentially(batchPromises);
  
          results.push(...batchResults);
  
          if (onProgress) {
            onProgress(results.length, resourceIds.length, errors);
          }
        }
  
        return {
          data: results,
          status: errors.length > 0 ? 207 : 200, // Multi-Status si erreurs
          headers: new Headers(),
          cached: false
        };
  
      } catch (error) {
        throw this.processDeleteError(error, endpoint);
      }
    }
  
    /**
     * Suppression conditionnelle
     */
    async conditionalDelete<TResponse = void>(
      config: ConditionalDeleteConfig<TResponse>
    ): Promise<ApiResponse<{ deletedCount: number; deletedIds: Array<string | number>; dryRun?: boolean }>> {
      const {
        endpoint,
        conditions,
        conditionsSchema,
        responseSchema,
        dryRun = false,
        maxItems = 100,
        cascade = false,
        softDelete = false,
        timeout = this.defaultTimeout,
        requireAuth = false
      } = config;
  
      try {
        // Valider les conditions
        const validatedConditions = conditionsSchema
          ? await this.validateData(conditionsSchema, conditions, endpoint)
          : conditions;
  
        // Construire les paramètres de requête
        const queryParams = {
          ...validatedConditions,
          dryRun,
          maxItems,
          cascade,
          softDelete
        };
  
        const fullUrl = UrlBuilder.buildUrl(this.baseUrl, endpoint, queryParams);
        const requestHeaders = await this.buildDeleteHeaders({}, requireAuth);
        const controller = this.createAbortController(timeout);
  
        const response = await this.executeDeleteRequest(fullUrl, requestHeaders, controller);
        const rawData = await this.handleDeleteResponse(response, endpoint);
  
        const result = {
          deletedCount: rawData?.deletedCount || 0,
          deletedIds: rawData?.deletedIds || [],
          dryRun
        };
  
        return {
          data: result,
          status: response.status,
          headers: response.headers,
          cached: false
        };
  
      } catch (error) {
        throw this.processDeleteError(error, endpoint);
      }
    }
  
    /**
     * Demander une confirmation de suppression
     */
    async requestDeleteConfirmation(
      endpoint: string,
      resourceId: string | number,
      options: { 
        cascade?: boolean;
        reason?: string;
        expirationMinutes?: number;
      } = {}
    ): Promise<DeleteConfirmation> {
      const { cascade = false, reason, expirationMinutes = 15 } = options;
  
      try {
        const resourceEndpoint = this.buildResourceEndpoint(endpoint, resourceId);
        const confirmationEndpoint = `${resourceEndpoint}/confirm-delete`;
  
        const requestBody = {
          cascade,
          reason,
          expirationMinutes
        };
  
        const response = await fetch(
          UrlBuilder.buildUrl(this.baseUrl, confirmationEndpoint),
          {
            method: 'POST',
            headers: await this.buildDeleteHeaders({}, true),
            body: JSON.stringify(requestBody)
          }
        );
  
        const rawData = await this.handleResponse(response, confirmationEndpoint);
        
        const confirmation: DeleteConfirmation = {
          token: rawData.token,
          expiresAt: new Date(rawData.expiresAt),
          resourceInfo: rawData.resourceInfo,
          warnings: rawData.warnings
        };
  
        // Stocker localement
        this.confirmationTokens.set(`${resourceId}`, confirmation);
  
        return confirmation;
  
      } catch (error) {
        throw this.processDeleteError(error, endpoint, resourceId);
      }
    }
  
    /**
     * Planifier une suppression
     */
    async scheduleDelete(config: ScheduledDeleteConfig): Promise<{ scheduleId: string; scheduledFor: Date }> {
      const {
        endpoint,
        resourceId,
        scheduledFor,
        timezone = 'UTC',
        recurring,
        notifyBeforeDelete,
        cascade = false,
        softDelete = false,
        reason
      } = config;
  
      try {
        const scheduleEndpoint = `${endpoint}/schedule-delete`;
        const scheduleData = {
          resourceId,
          scheduledFor: typeof scheduledFor === 'string' ? scheduledFor : scheduledFor.toISOString(),
          timezone,
          recurring,
          notifyBeforeDelete,
          cascade,
          softDelete,
          reason
        };
  
        const response = await fetch(
          UrlBuilder.buildUrl(this.baseUrl, scheduleEndpoint),
          {
            method: 'POST',
            headers: await this.buildDeleteHeaders({}, true),
            body: JSON.stringify(scheduleData)
          }
        );
  
        const result = await this.handleResponse(response, scheduleEndpoint);
        
        const scheduleInfo = {
          scheduleId: result.scheduleId,
          scheduledFor: new Date(result.scheduledFor)
        };
  
        // Stocker localement
        if (resourceId) {
          this.scheduledDeletes.set(`${resourceId}`, config);
        }
  
        return scheduleInfo;
  
      } catch (error) {
        throw this.processDeleteError(error, endpoint, resourceId);
      }
    }
  
    /**
     * Restaurer une ressource supprimée (soft delete)
     */
    async restore<TResponse = void>(
      config: RestoreConfig<TResponse>
    ): Promise<ApiResponse<TResponse | void>> {
      const {
        endpoint,
        resourceId,
        responseSchema,
        restorePoint,
        cascadeRestore = false,
        timeout = this.defaultTimeout,
        requireAuth = true
      } = config;
  
      try {
        const resourceEndpoint = this.buildResourceEndpoint(endpoint, resourceId);
        const restoreEndpoint = `${resourceEndpoint}/restore`;
  
        const restoreData = {
          restorePoint,
          cascadeRestore
        };
  
        const requestHeaders = await this.buildDeleteHeaders({}, requireAuth);
        const controller = this.createAbortController(timeout);
  
        const response = await fetch(
          UrlBuilder.buildUrl(this.baseUrl, restoreEndpoint),
          {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(restoreData),
            signal: controller.signal
          }
        );
  
        let responseData: TResponse | void = undefined;
        
        if (response.status !== 204) {
          const rawData = await this.handleResponse(response, restoreEndpoint);
          responseData = rawData;
          
          if (responseSchema && responseData !== undefined) {
            responseData = await this.validateData(responseSchema, responseData, restoreEndpoint);
          }
        }
  
        // Retirer des ressources supprimées
        this.deletedResources.delete(`${resourceId}`);
  
        return {
          data: responseData,
          status: response.status,
          headers: response.headers,
          cached: false
        };
  
      } catch (error) {
        throw this.processDeleteError(error, endpoint, resourceId);
      }
    }
  
    /**
     * Méthodes utilitaires simples
     */
    async deleteResource(
      endpoint: string,
      resourceId: string | number,
      options: {
        soft?: boolean;
        cascade?: boolean;
        confirm?: boolean;
      } = {}
    ): Promise<void> {
      const { soft = false, cascade = false, confirm = false } = options;
  
      let confirmationToken: string | undefined;
      
      if (confirm) {
        const confirmation = await this.requestDeleteConfirmation(endpoint, resourceId, { cascade });
        confirmationToken = confirmation.token;
      }
  
      await this.delete({
        endpoint,
        resourceId,
        softDelete: soft,
        cascade,
        confirmationToken
      });
    }
  
    async softDelete(
      endpoint: string,
      resourceId: string | number,
      reason?: string
    ): Promise<void> {
      await this.delete({
        endpoint,
        resourceId,
        softDelete: true,
        reason
      });
    }
  
    async forceDelete(
      endpoint: string,
      resourceId: string | number,
      confirmationToken?: string
    ): Promise<void> {
      await this.delete({
        endpoint,
        resourceId,
        forceDelete: true,
        confirmationToken
      });
    }
  
    async cascadeDelete(
      endpoint: string,
      resourceId: string | number,
      confirmationToken?: string
    ): Promise<void> {
      await this.delete({
        endpoint,
        resourceId,
        cascade: true,
        confirmationToken
      });
    }
  
    // Méthodes privées pour la logique interne
    private buildResourceEndpoint(endpoint: string, resourceId: string | number): string {
      if (endpoint.includes(':id')) {
        return endpoint.replace(':id', String(resourceId));
      }
      
      if (endpoint.includes('{id}')) {
        return endpoint.replace('{id}', String(resourceId));
      }
  
      return `${endpoint.replace(/\/$/, '')}/${resourceId}`;
    }
  
    private async preDeleteChecks(
      endpoint: string,
      resourceId?: string | number,
      force: boolean = false
    ): Promise<void> {
      if (!force && resourceId) {
        // Vérifier si la ressource est protégée
        const isProtected = await this.checkResourceProtection(endpoint, resourceId);
        if (isProtected.protected) {
          throw new ProtectedResourceError(
            isProtected.reason || 'Resource is protected',
            resourceId,
            isProtected.type || 'user_defined',
            isProtected.canOverride
          );
        }
  
        // Vérifier les dépendances
        const dependencies = await this.checkDependencies(endpoint, resourceId);
        if (dependencies.length > 0) {
          throw new DependencyError(
            `Resource has ${dependencies.length} dependencies`,
            resourceId,
            dependencies,
            'cascade'
          );
        }
      }
    }
  
    private async checkResourceProtection(
      endpoint: string,
      resourceId: string | number
    ): Promise<{
      protected: boolean;
      type?: 'system' | 'business_critical' | 'user_defined' | 'regulatory';
      reason?: string;
      canOverride?: boolean;
    }> {
      try {
        const checkEndpoint = `${endpoint}/${resourceId}/protection`;
        const response = await fetch(UrlBuilder.buildUrl(this.baseUrl, checkEndpoint), {
          method: 'GET',
          headers: await this.buildDeleteHeaders({}, true)
        });
  
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.warn('Could not check resource protection:', error);
      }
  
      return { protected: false };
    }
  
    private async checkDependencies(
      endpoint: string,
      resourceId: string | number
    ): Promise<Array<{ id: string | number; type: string; name?: string }>> {
      try {
        const depsEndpoint = `${endpoint}/${resourceId}/dependencies`;
        const response = await fetch(UrlBuilder.buildUrl(this.baseUrl, depsEndpoint), {
          method: 'GET',
          headers: await this.buildDeleteHeaders({}, true)
        });
  
        if (response.ok) {
          const data = await response.json();
          return data.dependencies || [];
        }
      } catch (error) {
        console.warn('Could not check dependencies:', error);
      }
  
      return [];
    }
  
    private async createBackup(
      endpoint: string,
      resourceId?: string | number
    ): Promise<unknown> {
      if (!resourceId) return null;
  
      try {
        const getService = new (await import('./GetService')).GetService(this.baseUrl);
        return await getService.getSimple(
          this.buildResourceEndpoint(endpoint, resourceId),
          z.any()
        );
      } catch (error) {
        console.warn('Could not create backup:', error);
        return null;
      }
    }
  
    private async handleOptimisticDelete(
      endpoint: string,
      resourceId?: string | number,
      softDelete: boolean = false,
      backupData?: unknown
    ): Promise<string> {
      if (!resourceId) return '';
  
      const optimisticId = `delete_${endpoint}_${resourceId}_${Date.now()}`;
      
      this.optimisticDeletes.set(optimisticId, {
        id: optimisticId,
        resourceId,
        originalData: backupData,
        timestamp: Date.now(),
        softDelete,
        rollbackFn: async () => {
          console.log(`Rollback optimistic delete for ${resourceId}`);
          // Logique de rollback - restaurer dans l'UI
        },
        restoreFn: async () => {
          if (softDelete && backupData) {
            console.log(`Restore ${resourceId} from backup`);
          }
        }
      });
  
      return optimisticId;
    }
  
    private buildDeleteParams(
      baseParams: Record<string, unknown> = {},
      deleteOptions: {
        cascade?: boolean;
        softDelete?: boolean;
        force?: boolean;
        reason?: string;
        confirmationToken?: string;
      }
    ): Record<string, unknown> {
      const params = { ...baseParams };
      
      if (deleteOptions.cascade) params.cascade = true;
      if (deleteOptions.softDelete) params.soft = true;
      if (deleteOptions.force) params.force = true;
      if (deleteOptions.reason) params.reason = deleteOptions.reason;
      if (deleteOptions.confirmationToken) params.confirmation_token = deleteOptions.confirmationToken;
      
      return params;
    }
  
    private async buildDeleteHeaders(
      headers: HeadersInit,
      requireAuth: boolean,
      confirmationToken?: string,
      dependencies?: string[]
    ): Promise<HeadersInit> {
      const requestHeaders = { ...this.defaultHeaders, ...headers };
  
      if (requireAuth) {
        const token = await this.getAuthToken();
        if (token) {
          (requestHeaders as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }
      }
  
      if (confirmationToken) {
        (requestHeaders as Record<string, string>)['X-Confirmation-Token'] = confirmationToken;
      }
  
      if (dependencies && dependencies.length > 0) {
        (requestHeaders as Record<string, string>)['X-Dependencies'] = dependencies.join(',');
      }
  
      return requestHeaders;
    }
  
    private async executeDeleteRequest(
      url: string,
      headers: HeadersInit,
      controller: AbortController
    ): Promise<Response> {
      return fetch(url, {
        method: 'DELETE',
        headers,
        signal: controller.signal
      });
    }
  
    private async handleDeleteResponse(response: Response, endpoint: string): Promise<unknown> {
      if (response.status === 204) {
        return null; // No Content
      }
  
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new ApiError(
          `DELETE ${response.status}: ${errorText}`,
          response.status,
          response.statusText,
          endpoint
        );
      }
  
      const contentType = response.headers.get('Content-Type') || '';
      
      if (contentType.includes('application/json')) {
        return response.json();
      }
      
      return response.text();
    }
  
    private recordDeletion(
      resourceId: string | number,
      endpoint: string,
      softDelete: boolean,
      reason?: string
    ): void {
      this.deletedResources.set(`${resourceId}`, {
        id: resourceId,
        type: endpoint,
        deletedAt: new Date(),
        reason,
        canRestore: softDelete,
        restoreUntil: softDelete ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined // 30 jours
      });
    }
  
    private async handleDeleteError(
      error: unknown,
      resourceId?: string | number,
      optimisticDelete: boolean = false
    ): Promise<void> {
      if (optimisticDelete && resourceId) {
        // Rollback tous les optimistic deletes pour cette ressource
        for (const [id, metadata] of this.optimisticDeletes.entries()) {
          if (metadata.resourceId === resourceId) {
            await metadata.rollbackFn();
            this.optimisticDeletes.delete(id);
          }
        }
      }
    }
  
    private processDeleteError(error: unknown, endpoint: string, resourceId?: string | number): Error {
      if (error instanceof DeleteError || 
          error instanceof DependencyError || 
          error instanceof PermissionDeniedError || 
          error instanceof ProtectedResourceError) {
        return error;
      }
  
      if (error instanceof ApiError) {
        // Convertir certains codes en erreurs spécialisées
        switch (error.status) {
          case 403:
            return new PermissionDeniedError(
              'Insufficient permissions to delete resource',
              resourceId || 'unknown',
              ['delete']
            );
          case 409:
            return new DependencyError(
              'Cannot delete resource due to dependencies',
              resourceId || 'unknown',
              [],
              'cascade'
            );
          case 422:
            return new ProtectedResourceError(
              'Resource is protected and cannot be deleted',
              resourceId || 'unknown',
              'user_defined',
              false
            );
          default:
            return error;
        }
      }
  
      if (error instanceof ValidationError || error instanceof NetworkError) {
        return error;
      }
  
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return new NetworkError('Network connection failed', error as Error, endpoint);
      }
  
      if (error instanceof DOMException && error.name === 'AbortError') {
        return new NetworkError('Request timeout', error as Error, endpoint);
      }
  
      return new DeleteError(
        'Unknown delete error occurred',
        resourceId,
        undefined
      );
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
  
    private async getAuthToken(): Promise<string | null> {
      if (typeof window !== 'undefined') {
        return this.getToken();
      }
      return null;
    }
  
    /**
     * Méthodes de gestion publiques
     */
    public getOptimisticDeletes(): OptimisticDeleteMetadata[] {
      return Array.from(this.optimisticDeletes.values());
    }
  
    public rollbackOptimisticDelete(optimisticId: string): boolean {
      const deleteOp = this.optimisticDeletes.get(optimisticId);
      if (deleteOp) {
        deleteOp.rollbackFn();
        this.optimisticDeletes.delete(optimisticId);
        return true;
      }
      return false;
    }
  
    public async restoreFromOptimistic(optimisticId: string): Promise<boolean> {
      const deleteOp = this.optimisticDeletes.get(optimisticId);
      if (deleteOp) {
        await deleteOp.restoreFn();
        this.optimisticDeletes.delete(optimisticId);
        return true;
      }
      return false;
    }
  
    public getDeletedResources(): DeletedResourceInfo[] {
      return Array.from(this.deletedResources.values());
    }
  
    public getScheduledDeletes(): Map<string, ScheduledDeleteConfig> {
      return new Map(this.scheduledDeletes);
    }
  
    public cancelScheduledDelete(resourceId: string | number): boolean {
      return this.scheduledDeletes.delete(`${resourceId}`);
    }
  
    public getConfirmationTokens(): Map<string, DeleteConfirmation> {
      return new Map(this.confirmationTokens);
    }
  
    public clearExpiredTokens(): void {
      const now = new Date();
      for (const [key, confirmation] of this.confirmationTokens.entries()) {
        if (confirmation.expiresAt < now) {
          this.confirmationTokens.delete(key);
        }
      }
    }
  
    public clearDeletedResourcesHistory(): void {
      this.deletedResources.clear();
    }
  }