// ============================================================
// src/components/backoffice/users/profile/userProfile.logic.ts
// Fonctions PURES (sans React) de la fiche Utilisateur : construction du
// brouillon, calcul des changements, validation, normalisation avant
// envoi, conversion vers le payload PATCH et lecture des erreurs DRF.
// Isolées du rendu pour être testables à plat (voir
// __tests__/userProfile.logic.test.ts).
// ============================================================

import type { BackendUser, BackendUserEcriturePayload } from '../../../../types/models/backend.types';
import { validateEmail } from '../../../../lib/validators';
import {
  EDITABLE_FIELD_NAMES, EDITABLE_FIELDS,
  type EditableField, type UserProfileDraft,
} from './userProfile.schema';

export type FieldErrors = Partial<Record<EditableField, string>>;

// ── Lecture ────────────────────────────────────────────────

/** Formate une date « pure » (`YYYY-MM-DD`) sans décalage de fuseau :
 * `new Date('1998-03-04')` est interprétée en UTC et s'afficherait la
 * veille sous un fuseau négatif. On la construit donc en heure locale. */
export function formatDateOnly(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Brouillon ──────────────────────────────────────────────

export function buildDraft(record: BackendUser): UserProfileDraft {
  const id = (value: number | null | undefined) => (value === null || value === undefined ? '' : String(value));
  return {
    firstName: record.firstName ?? '',
    lastName: record.lastName ?? '',
    dateOfBirth: record.dateOfBirth ? record.dateOfBirth.slice(0, 10) : '',
    email: record.email ?? '',
    phoneNumber: record.phoneNumber ?? '',
    address: record.address ?? '',
    role: record.role ?? '',
    etablissement: id(record.etablissement),
    organisation: id(record.organisation),
    // Même convention que l'affichage : seul `false` explicite = inactif.
    isActive: record.isActive !== false,
    isVerified: Boolean(record.isVerified),
  };
}

/** Miroir de `normaliser_telephone` (users/api/v1/services.py) : que des
 * chiffres, plus un éventuel « + » initial. Indispensable : le téléphone
 * est un IDENTIFIANT DE CONNEXION, comparé sous cette forme normalisée
 * -- et UserUpdateSerializer ne normalise rien à l'écriture. */
export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  const sign = trimmed.startsWith('+') ? '+' : '';
  return `${sign}${trimmed.replace(/\D/g, '')}`;
}

/** Forme canonique d'une valeur, utilisée à la fois pour COMPARER
 * (une retouche d'espaces n'est pas une modification) et pour ENVOYER. */
export function normalizeFieldValue(field: EditableField, value: string | boolean): string | boolean {
  if (typeof value === 'boolean') return value;
  if (field === 'email') return value.trim().toLowerCase();
  if (field === 'phoneNumber') return normalizePhone(value);
  return value.trim();
}

/** Champs réellement modifiés, déjà normalisés : c'est exactement ce
 * qu'il faut envoyer en PATCH (rien de plus, donc aucun risque d'écraser
 * un champ que l'utilisateur n'a pas touché). */
export function computeChanges(initial: UserProfileDraft, draft: UserProfileDraft): Partial<UserProfileDraft> {
  const changes: Record<string, string | boolean> = {};
  for (const field of EDITABLE_FIELD_NAMES) {
    const before = normalizeFieldValue(field, initial[field]);
    const after = normalizeFieldValue(field, draft[field]);
    if (before !== after) changes[field] = after;
  }
  return changes as Partial<UserProfileDraft>;
}

// ── Validation ─────────────────────────────────────────────

const PHONE_PATTERN = /^\+?\d{9,15}$/; // = TELEPHONE_REGEX du backend, hors « 1 » facultatif.
const NAME_MAX = 150; // max_length de first_name/last_name (AbstractUser).

export const IDENTIFIER_REQUIRED_MESSAGE = 'Email ou téléphone requis.';

/**
 * Valide UNIQUEMENT ce qui a changé : une valeur historique déjà
 * bancale en base ne doit pas bloquer la modification d'un autre champ.
 */
export function validateDraft(initial: UserProfileDraft, draft: UserProfileDraft, today: Date = new Date()): FieldErrors {
  const errors: FieldErrors = {};
  const changes = computeChanges(initial, draft);
  const changed = (field: EditableField) => field in changes;

  if (changed('firstName') && String(changes.firstName).length > NAME_MAX) {
    errors.firstName = `${NAME_MAX} caractères maximum.`;
  }
  if (changed('lastName') && String(changes.lastName).length > NAME_MAX) {
    errors.lastName = `${NAME_MAX} caractères maximum.`;
  }

  if (changed('email') && changes.email && !validateEmail(String(changes.email))) {
    errors.email = 'Saisissez un email valide.';
  }
  if (changed('phoneNumber') && changes.phoneNumber && !PHONE_PATTERN.test(String(changes.phoneNumber))) {
    errors.phoneNumber = 'Saisissez un numéro valide (9 à 15 chiffres, « + » accepté au début).';
  }

  // Email et téléphone sont les DEUX SEULS identifiants de connexion
  // (voir users/models.py) : les vider tous les deux rendrait le compte
  // inaccessible. Règle appliquée dès que l'un des deux est modifié.
  if (changed('email') || changed('phoneNumber')) {
    const finalEmail = normalizeFieldValue('email', draft.email);
    const finalPhone = normalizeFieldValue('phoneNumber', draft.phoneNumber);
    if (!finalEmail && !finalPhone) {
      errors.email = errors.email ?? IDENTIFIER_REQUIRED_MESSAGE;
      errors.phoneNumber = errors.phoneNumber ?? IDENTIFIER_REQUIRED_MESSAGE;
    }
  }

  if (changed('dateOfBirth') && changes.dateOfBirth) {
    const parsed = new Date(`${changes.dateOfBirth}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) errors.dateOfBirth = 'Date invalide.';
    else if (parsed.getTime() > today.getTime()) errors.dateOfBirth = 'La date ne peut pas être dans le futur.';
  }

  if (changed('role') && !EDITABLE_FIELDS.role.options?.some((o) => o.value === changes.role)) {
    errors.role = 'Rôle inconnu.';
  }

  return errors;
}

// ── Écriture (registre) ────────────────────────────────────

function toNullableId(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * Convertit les valeurs de formulaire en payload PATCH.
 *
 * Règle : une clé ABSENTE (ou `undefined`) n'est pas envoyée -- « je n'y
 * touche pas ». Une valeur vide, elle, est une instruction : `''` efface
 * un texte (le backend normalise '' -> NULL pour email/téléphone), et
 * `''` sur une FK ou une date devient `null`. L'ancien mapper écrasait
 * la date de naissance par `null` dès qu'elle n'était pas dans les
 * valeurs, et rendait impossible d'effacer un téléphone.
 */
export function buildUserPatch(values: Record<string, unknown>): Partial<BackendUserEcriturePayload> {
  const patch: Partial<BackendUserEcriturePayload> = {};
  const has = (key: string) => values[key] !== undefined;
  const text = (key: string) => String(values[key] ?? '').trim();

  if (has('firstName')) patch.firstName = text('firstName');
  if (has('lastName')) patch.lastName = text('lastName');
  if (has('email')) patch.email = text('email');
  if (has('phoneNumber')) patch.phoneNumber = text('phoneNumber');
  if (has('address')) patch.address = text('address');
  if (has('role') && text('role')) patch.role = text('role') as BackendUserEcriturePayload['role'];
  if (has('isActive')) patch.isActive = Boolean(values.isActive);
  if (has('isVerified')) patch.isVerified = Boolean(values.isVerified);
  if (has('dateOfBirth')) patch.dateOfBirth = text('dateOfBirth') || null;

  const etablissement = toNullableId(values.etablissement);
  if (etablissement !== undefined) patch.etablissement = etablissement;
  const organisation = toNullableId(values.organisation);
  if (organisation !== undefined) patch.organisation = organisation;

  return patch;
}

// ── Erreurs de sauvegarde ──────────────────────────────────

export interface SaveErrorReport {
  /** Message global (bandeau + toast). */
  message: string;
  /** Erreurs rattachées à un cadre précis (réponse 400 de DRF). */
  fieldErrors: FieldErrors;
}

/**
 * Lit une erreur de sauvegarde. Une 400 DRF a la forme
 * `{ email: ["…"], phoneNumber: ["…"] }` (clés déjà en camelCase, voir
 * CamelCaseJSONRenderer) et est portée par `ApiError.details` : on
 * rattache chaque message à son cadre plutôt que d'afficher le
 * statusText générique « Bad Request ».
 */
export function interpretSaveError(err: unknown): SaveErrorReport {
  const fieldErrors: FieldErrors = {};
  const details = (err as { details?: unknown } | null)?.details;

  if (details && typeof details === 'object' && !Array.isArray(details)) {
    for (const field of EDITABLE_FIELD_NAMES) {
      const raw = (details as Record<string, unknown>)[field];
      const first = Array.isArray(raw) ? raw[0] : raw;
      if (typeof first === 'string' && first.trim()) fieldErrors[field] = first;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { message: 'Certains champs sont invalides : corrigez-les puis réessayez.', fieldErrors };
  }
  return {
    message: err instanceof Error && err.message ? err.message : 'Une erreur est survenue.',
    fieldErrors,
  };
}
