// ============================================================
// src/components/backoffice/utils.ts
// Petites fonctions pures partagées par le tableau liste, l'édition
// en ligne (cellules du tableau) et le formulaire génériques du
// backoffice.
// ============================================================

import type { FieldDef } from './registry/types';

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

/**
 * Construit l'état de formulaire (forme d'ÉCRITURE, une valeur "plate"
 * par champ) à partir d'un enregistrement de LECTURE — partagé par
 * `BackofficeRecordForm` (édition en page dédiée) ET
 * `BackofficeEditableCell` (édition en ligne dans le tableau) : les
 * deux doivent produire exactement le même objet `values` avant de le
 * transmettre à `model.data.update`, pour que les deux façons
 * d'éditer un enregistrement soient strictement équivalentes côté API.
 */
export function buildInitialValues<TRecord extends Record<string, unknown>>(
  fields: FieldDef<TRecord>[],
  record: TRecord | undefined,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = record ? (record as Record<string, unknown>)[field.name] : undefined;
    switch (field.type) {
      case 'fk':
        values[field.name] = extractFkId(raw);
        break;
      case 'datetime':
        values[field.name] = toDatetimeLocalValue(raw);
        break;
      case 'date':
        values[field.name] = toDateValue(raw);
        break;
      case 'tags':
        values[field.name] = Array.isArray(raw) ? [...raw] : [];
        break;
      case 'boolean':
        values[field.name] = Boolean(raw);
        break;
      default:
        values[field.name] = raw ?? '';
    }
  }
  return values;
}
