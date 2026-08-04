// ============================================================
// src/services/api/errors/ValidationError.ts
// Erreur levée quand une requête ou une réponse ne respecte pas
// le schéma Zod attendu.
// ============================================================

export class ValidationError extends Error {
  /** Détail des problèmes de validation Zod (ZodIssue[]) */
  public readonly issues: unknown[];
  /** Endpoint concerné, si connu */
  public readonly endpoint?: string;

  constructor(message: string, issues: unknown[] = [], endpoint?: string) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
    this.endpoint = endpoint;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
