// ============================================================
// src/services/api/errors/DeleteError.ts
// Famille d'erreurs spécifiques aux opérations de suppression.
// ============================================================

export class DeleteError extends Error {
  public readonly resourceId?: string | number;
  public readonly cause?: unknown;

  constructor(message: string, resourceId?: string | number, cause?: unknown) {
    super(message);
    this.name = 'DeleteError';
    this.resourceId = resourceId;
    this.cause = cause;
    Object.setPrototypeOf(this, DeleteError.prototype);
  }
}

export interface DependencyRef {
  id: string | number;
  type: string;
  name?: string;
}

/** La ressource ne peut être supprimée car d'autres ressources en dépendent. */
export class DependencyError extends DeleteError {
  public readonly dependencies: DependencyRef[];
  public readonly strategy: string;

  constructor(message: string, resourceId: string | number, dependencies: DependencyRef[], strategy: string) {
    super(message, resourceId);
    this.name = 'DependencyError';
    this.dependencies = dependencies;
    this.strategy = strategy;
    Object.setPrototypeOf(this, DependencyError.prototype);
  }
}

/** L'utilisateur courant n'a pas les permissions nécessaires pour supprimer. */
export class PermissionDeniedError extends DeleteError {
  public readonly requiredPermissions: string[];

  constructor(message: string, resourceId: string | number, requiredPermissions: string[]) {
    super(message, resourceId);
    this.name = 'PermissionDeniedError';
    this.requiredPermissions = requiredPermissions;
    Object.setPrototypeOf(this, PermissionDeniedError.prototype);
  }
}

/** La ressource est protégée par le système et ne peut pas (ou difficilement) être supprimée. */
export class ProtectedResourceError extends DeleteError {
  public readonly protectionType: 'system' | 'business_critical' | 'user_defined' | 'regulatory';
  public readonly canOverride?: boolean;

  constructor(
    message: string,
    resourceId: string | number,
    protectionType: 'system' | 'business_critical' | 'user_defined' | 'regulatory',
    canOverride?: boolean
  ) {
    super(message, resourceId);
    this.name = 'ProtectedResourceError';
    this.protectionType = protectionType;
    this.canOverride = canOverride;
    Object.setPrototypeOf(this, ProtectedResourceError.prototype);
  }
}
