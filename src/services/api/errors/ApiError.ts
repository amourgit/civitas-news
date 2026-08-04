// ============================================================
// src/services/api/errors/ApiError.ts
// Erreur générique retournée par un appel API (statut HTTP non-2xx,
// erreur serveur, etc.)
// ============================================================

export class ApiError extends Error {
  /** Code de statut HTTP renvoyé par le serveur (0 = pas de réponse réseau) */
  public readonly status: number;
  /** Code d'erreur métier / machine renvoyé par l'API (ex: "USER_NOT_FOUND") */
  public readonly code?: string;
  /** Endpoint appelé au moment de l'erreur, utile pour le debug/logging */
  public readonly endpoint?: string;
  /** Corps brut de la réponse d'erreur, si disponible */
  public readonly details?: unknown;

  constructor(message: string, status = 500, code?: string, endpoint?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.endpoint = endpoint;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export { ValidationError } from './ValidationError';
export { NetworkError } from './NetworkError';
