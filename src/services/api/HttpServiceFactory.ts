// services/HttpServiceFactory.ts
import { GetService } from "./GetService";
import { PostService } from "./PostService";
import { UpdateService } from "./UpdateService";
import { DeleteService } from "./DeleteService";

// services/HttpServiceFactory.ts (mise à jour finale)
export class HttpServiceFactory {
  private static getInstances = new Map<string, GetService>();
  private static postInstances = new Map<string, PostService>();
  private static updateInstances = new Map<string, UpdateService>();
  private static deleteInstances = new Map<string, DeleteService>();

  static createGetService(
    baseUrl?: string,
    defaultHeaders?: HeadersInit,
    defaultTimeout?: number
  ): GetService {
    const key = this.generateKey(baseUrl, defaultHeaders, defaultTimeout);
    if (!this.getInstances.has(key)) {
      this.getInstances.set(key, new GetService(baseUrl, defaultHeaders, defaultTimeout));
    }
    return this.getInstances.get(key)!;
  }

  static createPostService(
    baseUrl?: string,
    defaultHeaders?: HeadersInit,
    defaultTimeout?: number
  ): PostService {
    const key = this.generateKey(baseUrl, defaultHeaders, defaultTimeout);
    if (!this.postInstances.has(key)) {
      this.postInstances.set(key, new PostService(baseUrl, defaultHeaders, defaultTimeout));
    }
    return this.postInstances.get(key)!;
  }

  static createUpdateService(
    baseUrl?: string,
    defaultHeaders?: HeadersInit,
    defaultTimeout?: number
  ): UpdateService {
    const key = this.generateKey(baseUrl, defaultHeaders, defaultTimeout);
    if (!this.updateInstances.has(key)) {
      this.updateInstances.set(key, new UpdateService(baseUrl, defaultHeaders, defaultTimeout));
    }
    return this.updateInstances.get(key)!;
  }

  static createDeleteService(
    baseUrl?: string,
    defaultHeaders?: HeadersInit,
    defaultTimeout?: number
  ): DeleteService {
    const key = this.generateKey(baseUrl, defaultHeaders, defaultTimeout);
    if (!this.deleteInstances.has(key)) {
      this.deleteInstances.set(key, new DeleteService(baseUrl, defaultHeaders, defaultTimeout));
    }
    return this.deleteInstances.get(key)!;
  }

  static createCompleteHttpService(
    baseUrl?: string,
    defaultHeaders?: HeadersInit,
    defaultTimeout?: number
  ) {
    return {
      get: this.createGetService(baseUrl, defaultHeaders, defaultTimeout),
      post: this.createPostService(baseUrl, defaultHeaders, defaultTimeout),
      update: this.createUpdateService(baseUrl, defaultHeaders, defaultTimeout),
      delete: this.createDeleteService(baseUrl, defaultHeaders, defaultTimeout)
    };
  }

  private static generateKey(
    baseUrl?: string,
    defaultHeaders?: HeadersInit,
    defaultTimeout?: number
  ): string {
    return `${baseUrl || 'default'}-${JSON.stringify(defaultHeaders || {})}-${defaultTimeout || 10000}`;
  }

  static clearInstances(): void {
    this.getInstances.clear();
    this.postInstances.clear();
    this.updateInstances.clear();
    this.deleteInstances.clear();
  }
}