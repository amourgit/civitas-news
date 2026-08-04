// ============================================================
// src/services/api/utils/sanitizer.ts
// Nettoyage défensif des paramètres/corps de requête avant envoi :
//  - retire les valeurs undefined/null (évite "?foo=undefined")
//  - neutralise les clés dangereuses (prototype pollution)
//  - échappe les chaînes pour limiter les risques d'injection basique
// ============================================================

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export class RequestSanitizer {
  /**
   * Nettoie un objet de paramètres (query params ou body) :
   * - supprime les entrées `undefined`/`null`
   * - supprime les clés dangereuses (prototype pollution)
   * - nettoie récursivement les chaînes de caractères
   */
  static sanitizeParams<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
    if (input === null || typeof input !== 'object') {
      return {};
    }

    const output: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
      if (DANGEROUS_KEYS.has(key)) continue;
      if (value === undefined || value === null) continue;

      output[key] = RequestSanitizer.sanitizeValue(value);
    }

    return output;
  }

  private static sanitizeValue(value: unknown): unknown {
    if (typeof value === 'string') {
      return RequestSanitizer.sanitizeString(value);
    }
    if (Array.isArray(value)) {
      return value.map((item) => RequestSanitizer.sanitizeValue(item));
    }
    if (value !== null && typeof value === 'object') {
      if (value instanceof Date || value instanceof File || value instanceof Blob) {
        return value;
      }
      return RequestSanitizer.sanitizeParams(value as Record<string, unknown>);
    }
    return value;
  }

  /** Retire les caractères de contrôle et neutralise les balises `<script>` basiques. */
  private static sanitizeString(value: string): string {
    return value
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  }
}
