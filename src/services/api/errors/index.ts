// ============================================================
// src/services/api/errors/index.ts
// Point d'entrée unique pour toutes les erreurs de la couche API.
// Utiliser cet import de préférence : `import { ApiError, ... } from '@/services/api/errors'`
// ============================================================

export { ApiError } from './ApiError';
export { ValidationError } from './ValidationError';
export { NetworkError } from './NetworkError';
export { ConflictError } from './ConflictError';
export type { ConflictInfo } from './ConflictError';
export {
  DeleteError,
  DependencyError,
  PermissionDeniedError,
  ProtectedResourceError,
} from './DeleteError';
export type { DependencyRef } from './DeleteError';
