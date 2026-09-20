// ============================================================
// src/components/backoffice/users/profile/useProfileFieldAccess.ts
// Résout, champ par champ, « puis-je modifier ceci ? » -- et sinon
// POURQUOI (la raison est affichée à côté du cadre verrouillé).
//
// Trois verrous, du plus général au plus fin :
//   1. `canManage`      : porte d'entrée (ADMIN_UTILISATEUR_GERER, décidée
//                         par BackofficeRecordPage) ;
//   2. permission du champ (EDITABLE_FIELDS[x].editPermission) ;
//   3. `lockWhenSelf`   : garde-fou anti-auto-verrouillage sur son propre compte.
// ============================================================

import { usePermissions } from '../../../../lib/permissions/usePermissions';
import { useAuthStore } from '../../../../store/auth.store';
import type { BackendUser } from '../../../../types/models/backend.types';
import { EDITABLE_FIELDS, EDITABLE_FIELD_NAMES, type EditableField } from './userProfile.schema';

export interface ProfileFieldAccess {
  canEditField: (field: EditableField) => boolean;
  /** `null` si le champ est modifiable, sinon la raison lisible du verrou. */
  lockReason: (field: EditableField) => string | null;
  /** Au moins un champ modifiable : conditionne le bouton « Modifier ». */
  canEditAny: boolean;
  isSelf: boolean;
}

export function useProfileFieldAccess(record: BackendUser, canManage: boolean): ProfileFieldAccess {
  const { can } = usePermissions();
  const { user } = useAuthStore();
  const isSelf = String(user?.id) === String(record.id);

  const lockReason = (field: EditableField): string | null => {
    const def = EDITABLE_FIELDS[field];
    if (!canManage) return "Vous n'avez pas le droit de modifier cette fiche.";
    if (!can(def.editPermission)) return "Vous n'avez pas la permission de modifier ce champ.";
    if (def.lockWhenSelf && isSelf) return 'Non modifiable sur votre propre compte.';
    return null;
  };

  const canEditField = (field: EditableField) => lockReason(field) === null;
  const canEditAny = EDITABLE_FIELD_NAMES.some(canEditField);

  return { canEditField, lockReason, canEditAny, isSelf };
}
