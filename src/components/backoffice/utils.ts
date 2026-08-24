// ============================================================
// src/components/backoffice/utils.ts
// Petites fonctions pures partagées par le tableau liste et le
// formulaire génériques du backoffice.
// ============================================================

/**
 * Extrait l'id d'une valeur de champ FK, qu'elle soit représentée en
 * LECTURE comme un objet imbriqué complet (ex: `News.categorie` ->
 * `{id, nom, couleur, icone}`) ou comme un id brut (ex: `Sondage.newsId`
 * -> `"42"`, ou `BackendUser.etablissement` -> `7`). Ce sont bien deux
 * conventions réelles et distinctes côté backend (voir les commentaires
 * dans news.types.ts/sondage.types.ts/backend.types.ts) — ce helper les
 * unifie pour l'affichage/l'édition, sans jamais deviner à tort.
 */
export function extractFkId(value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'object') {
    const id = (value as Record<string, unknown>).id;
    return id === null || id === undefined ? undefined : String(id);
  }
  return String(value);
}

/** Tronque une chaîne ISO-8601 (avec ou sans fuseau) au format attendu
 * par `<input type="datetime-local">` : `YYYY-MM-DDTHH:mm`. */
export function toDatetimeLocalValue(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  return value.slice(0, 16);
}

/** Tronque une chaîne ISO-8601 au format attendu par `<input type="date">` : `YYYY-MM-DD`. */
export function toDateValue(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  return value.slice(0, 10);
}

/** Formatte une date ISO pour l'affichage compact dans une colonne de tableau. */
export function formatListDate(value: unknown): string {
  if (typeof value !== 'string' || !value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
