// ============================================================
// src/components/backoffice/users/UserRecordDetail.tsx
// Fiche détail des Utilisateurs (backoffice), branchée via
// ModelDef.RecordExtras + recordViewMode: 'replace' (voir
// utilisateur.registry.ts et BackofficeRecordPage).
//
// UNE SEULE fiche, en lecture comme en édition : au clic sur
// « Modifier », les cadres d'information deviennent des champs, EN PLACE
// (le nom, le rôle et les statuts de la bannière aussi). Plus de bascule
// vers un formulaire générique séparé, à la Django admin.
//
// Le cadre du mot de passe reste grisé en toute circonstance : le
// backend ne renvoie jamais le mot de passe et n'accepte pas sa
// modification par cette route (UserUpdateSerializer).
//
// Découpage (dossier ./profile) :
//   userProfile.schema.ts   champs, permissions par champ, ordre des cadres
//   userProfile.logic.ts    brouillon, diff, validation, patch (pur)
//   useUserProfileDraft     état d'édition        useProfileFieldAccess  droits par champ
//   ProfileBanner / ProfileTile / TileFrame / ProfileEditBar   l'interface
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { Award, BadgeCheck, BadgeX } from 'lucide-react';
import { ConfirmDialog } from '../ConfirmDialog';
import type { ModelDef } from '../registry/types';
import type { BackendUser } from '../../../types/models/backend.types';
import { toast } from '../../../hooks/useToast';
import { getUserDisplayName } from './InitialsAvatar';
import { ProfileBanner } from './profile/ProfileBanner';
import { ProfileTile, type ProfileMode } from './profile/ProfileTile';
import { ProfileEditBar } from './profile/ProfileEditBar';
import { fieldInputId } from './profile/ProfileFieldEditor';
import { useUserProfileDraft } from './profile/useUserProfileDraft';
import { useProfileFieldAccess } from './profile/useProfileFieldAccess';
import { interpretSaveError } from './profile/userProfile.logic';
import { PROFILE_TILES } from './profile/userProfile.schema';

export interface UserRecordDetailProps {
  model: ModelDef<BackendUser>;
  record: BackendUser;
  canManage: boolean;
  onUpdated: (updated: BackendUser) => void;
  onBack: () => void;
}

type PendingLeave = 'cancel' | 'back' | null;

export default function UserRecordDetail({ model, record, canManage, onUpdated, onBack }: UserRecordDetailProps) {
  const [mode, setMode] = useState<ProfileMode>('view');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingLeave, setPendingLeave] = useState<PendingLeave>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const previousMode = useRef<ProfileMode>(mode);

  const name = getUserDisplayName(record);
  const form = useUserProfileDraft(record);
  const access = useProfileFieldAccess(record, canManage);
  const editing = mode === 'edit';

  // Focus : à l'entrée en édition, sur le premier champ ; au retour en
  // lecture, sur « Modifier » (le bouton sur lequel on avait cliqué a
  // été démonté, le focus serait sinon perdu).
  useEffect(() => {
    if (previousMode.current === mode) return;
    previousMode.current = mode;
    const root = formRef.current;
    if (!root) return;
    if (mode === 'edit') root.querySelector<HTMLElement>('input:not([disabled])')?.focus();
    else root.querySelector<HTMLElement>('[data-edit-button]')?.focus();
  }, [mode]);

  const startEditing = () => {
    form.reset();
    setFormError(null);
    setMode('edit');
  };

  const stopEditing = () => {
    form.reset();
    setFormError(null);
    setMode('view');
  };

  const requestCancel = () => (form.changeCount > 0 ? setPendingLeave('cancel') : stopEditing());
  const requestBack = () => (editing && form.changeCount > 0 ? setPendingLeave('back') : onBack());

  const discardChanges = () => {
    const target = pendingLeave;
    setPendingLeave(null);
    stopEditing();
    if (target === 'back') onBack();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing || isSaving) return;
    setFormError(null);

    const firstInvalid = form.validate();
    if (firstInvalid) {
      setFormError('Corrigez les champs signalés avant d’enregistrer.');
      document.getElementById(fieldInputId(firstInvalid))?.focus();
      return;
    }
    if (form.changeCount === 0) {
      stopEditing();
      return;
    }
    if (!model.data.update) {
      setFormError('Cette opération n’est pas disponible pour cette table.');
      return;
    }

    setIsSaving(true);
    try {
      // Uniquement les champs modifiés (PATCH) : rien d'autre n'est réécrit.
      const saved = await model.data.update(String(record.id), { ...form.changes });
      toast('success', 'Modifications enregistrées', name);
      onUpdated(saved);
      setMode('view');
    } catch (err) {
      const report = interpretSaveError(err);
      form.setErrors(report.fieldErrors);
      setFormError(report.message);
      toast('error', 'Échec de l’enregistrement', report.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <ProfileBanner
          record={record}
          name={name}
          mode={mode}
          form={form}
          access={access}
          disabled={isSaving}
          onBack={requestBack}
          onEdit={startEditing}
        />

        {formError && (
          <div
            role="alert"
            className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-sm text-red-600 dark:text-red-400"
          >
            {formError}
          </div>
        )}

        {/* Grille d'informations : les mêmes cadres en lecture et en édition. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PROFILE_TILES.map((def) => (
            <ProfileTile key={def.id} def={def} record={record} mode={mode} form={form} access={access} disabled={isSaving} />
          ))}
        </div>

        {/* Badges -- attribués par le système, uniquement si l'utilisateur en possède au moins un. */}
        {record.badges && record.badges.length > 0 && (
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1A1F4D] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-[#5B4DFF]" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Badges</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {record.badges.map((badge) => (
                <span
                  key={badge.id}
                  title={badge.description}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#5B4DFF]/10 text-[#5B4DFF] dark:bg-[#5B4DFF]/20"
                >
                  <span aria-hidden>{badge.icone}</span>
                  {badge.nom}
                </span>
              ))}
            </div>
          </div>
        )}

        {!editing && record.isVerified === false && (
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 px-1">
            <BadgeX className="w-3.5 h-3.5" />
            Compte non vérifié -- certaines actions peuvent être limitées côté produit.
          </div>
        )}
        {!editing && record.isVerified && (
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 px-1">
            <BadgeCheck className="w-3.5 h-3.5 text-sky-500" />
            Identité vérifiée.
          </div>
        )}

        {editing && <ProfileEditBar changeCount={form.changeCount} isSaving={isSaving} onCancel={requestCancel} />}
      </form>

      <ConfirmDialog
        isOpen={pendingLeave !== null}
        title="Abandonner les modifications ?"
        description="Les changements non enregistrés seront perdus."
        confirmLabel="Abandonner"
        onConfirm={discardChanges}
        onCancel={() => setPendingLeave(null)}
      />
    </>
  );
}
