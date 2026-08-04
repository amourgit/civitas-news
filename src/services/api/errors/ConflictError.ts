// ============================================================
// src/services/api/errors/ConflictError.ts
// Erreur levée sur un conflit de version (HTTP 409) lors d'un
// PUT/PATCH — ex: la ressource a été modifiée entre-temps par
// quelqu'un d'autre (gestion d'ETag / If-Match).
// ============================================================

export interface ConflictInfo {
  endpoint: string;
  resourceId: string | number;
  clientEtag?: string;
  serverEtag?: string;
}

export class ConflictError extends Error {
  public readonly conflictInfo?: ConflictInfo;
  public readonly serverData?: unknown;

  constructor(message: string, conflictInfo?: ConflictInfo, serverData?: unknown) {
    super(message);
    this.name = 'ConflictError';
    this.conflictInfo = conflictInfo;
    this.serverData = serverData;
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
