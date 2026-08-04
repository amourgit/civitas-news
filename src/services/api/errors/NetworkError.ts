// ============================================================
// src/services/api/errors/NetworkError.ts
// Erreur levée quand la requête n'atteint pas le serveur
// (connexion perdue, timeout, CORS, DNS...).
// ============================================================

export class NetworkError extends Error {
  public readonly cause?: Error;
  public readonly endpoint?: string;

  constructor(message: string, cause?: Error, endpoint?: string) {
    super(message);
    this.name = 'NetworkError';
    this.cause = cause;
    this.endpoint = endpoint;
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}
