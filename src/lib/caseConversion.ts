// ============================================================
// src/lib/caseConversion.ts
// Normalise récursivement les clés snake_case (convention Django/DRF
// classique) en camelCase (convention des schémas Zod de ce front),
// pour les endpoints qui ne passent pas par un sérialiseur DRF
// standard (ex: statistiques/api/v1/services.py, une fonction Python
// qui construit un dict à la main plutôt que via un serializer).
//
// Idempotent : une clé déjà en camelCase (ou sans underscore) traverse
// sans changement -- sûr à appliquer même si le backend est corrigé
// plus tard pour renvoyer directement du camelCase.
// ============================================================

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

export function toCamelCaseDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toCamelCaseDeep);
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [snakeToCamel(key), toCamelCaseDeep(val)])
    );
  }
  return value;
}
