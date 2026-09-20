// ============================================================
// src/components/backoffice/users/profile/useUserProfileDraft.ts
// État d'ÉDITION de la fiche : brouillon, erreurs par champ, diff par
// rapport à l'enregistrement d'origine. Le brouillon est resynchronisé
// dès que l'enregistrement change (typiquement après une sauvegarde
// réussie : la fiche relue par le backend devient la nouvelle base).
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BackendUser } from '../../../../types/models/backend.types';
import type { EditableField, UserProfileDraft } from './userProfile.schema';
import { buildDraft, computeChanges, validateDraft, type FieldErrors } from './userProfile.logic';

export interface UserProfileForm {
  values: UserProfileDraft;
  errors: FieldErrors;
  /** Champs modifiés, déjà normalisés -- le corps exact du PATCH. */
  changes: Partial<UserProfileDraft>;
  changeCount: number;
  isDirty: (field: EditableField) => boolean;
  setValue: <K extends EditableField>(field: K, value: UserProfileDraft[K]) => void;
  /** Remplace les erreurs (ex : erreurs de champ renvoyées par le backend). */
  setErrors: (errors: FieldErrors) => void;
  /** Revient à l'état de l'enregistrement, sans erreur. */
  reset: () => void;
  /** Valide le brouillon ; renvoie le premier champ en erreur, `null` si tout est valide. */
  validate: () => EditableField | null;
}

export function useUserProfileDraft(record: BackendUser): UserProfileForm {
  const initial = useMemo(() => buildDraft(record), [record]);
  // Clé de CONTENU : un parent qui recrée l'objet `record` à chaque rendu
  // (sans que rien n'ait changé) ne doit pas effacer une saisie en cours.
  const initialKey = JSON.stringify(initial);

  const [values, setValues] = useState<UserProfileDraft>(initial);
  const [errors, setErrorsState] = useState<FieldErrors>({});

  useEffect(() => {
    setValues(initial);
    setErrorsState({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  const changes = useMemo(() => computeChanges(initial, values), [initial, values]);
  const changeCount = Object.keys(changes).length;

  const isDirty = useCallback((field: EditableField) => field in changes, [changes]);

  const setValue = useCallback(<K extends EditableField>(field: K, value: UserProfileDraft[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Corriger un champ efface son erreur : elle a rempli son rôle.
    setErrorsState((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const setErrors = useCallback((next: FieldErrors) => setErrorsState(next), []);

  const reset = useCallback(() => {
    setValues(initial);
    setErrorsState({});
  }, [initial]);

  const validate = useCallback((): EditableField | null => {
    const found = validateDraft(initial, values);
    setErrorsState(found);
    const first = Object.keys(found)[0] as EditableField | undefined;
    return first ?? null;
  }, [initial, values]);

  return { values, errors, changes, changeCount, isDirty, setValue, setErrors, reset, validate };
}
