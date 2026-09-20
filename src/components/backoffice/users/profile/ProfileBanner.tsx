// ============================================================
// src/components/backoffice/users/profile/ProfileBanner.tsx
// Bannière de la fiche : avatar, nom, identifiant, rôle et statuts.
// En édition, ce sont ces MÊMES éléments qui deviennent modifiables :
//   - le nom -> deux champs Prénom / Nom (sur le dégradé) ;
//   - le rôle -> une pastille qui ouvre la liste des rôles ;
//   - « Actif » / « Vérifié » -> pastilles-interrupteurs.
// Chaque contrôle obéit à la permission de SON champ (voir
// useProfileFieldAccess) : sans elle, il reste la pastille de lecture.
// ============================================================

import React, { useState } from 'react';
import { ArrowLeft, Pencil, Lock, ChevronDown, Check } from 'lucide-react';
import { Button } from '../../../ui/Button';
import { InlineCellPopover } from '../../fields/InlineCellPopover';
import { InitialsAvatar, getInitials, getUserDisplayName } from '../InitialsAvatar';
import { ProfileTextInput } from './ProfileTextInput';
import { ROLE_LABELS, ROLE_OPTIONS } from '../../../../lib/constants/userRoles';
import { cn } from '../../../../lib/utils';
import type { BackendUser } from '../../../../types/models/backend.types';
import type { UserProfileForm } from './useUserProfileDraft';
import type { ProfileFieldAccess } from './useProfileFieldAccess';
import type { ProfileMode } from './ProfileTile';

/** Couleur du point associé à chaque rôle (le fond de la pastille reste
 * blanc translucide, lisible quel que soit le rôle sur le dégradé). */
const ROLE_DOT_COLOR: Record<string, string> = {
  administrateur: 'bg-red-400',
  moderateur: 'bg-amber-400',
  organisation: 'bg-sky-400',
  etudiant: 'bg-emerald-400',
};

const PILL_BASE =
  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white backdrop-blur-sm border';
const PILL_STATIC = 'bg-white/15 border-white/20';
const PILL_EDITABLE =
  'bg-white/25 border-white/50 hover:bg-white/30 cursor-pointer transition-colors motion-reduce:transition-none '
  + 'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-60 disabled:cursor-not-allowed';
const PILL_DIRTY = 'border-white';

function StatusPill({ children, dotClassName, title }: { children: React.ReactNode; dotClassName: string; title?: string }) {
  return (
    <span className={cn(PILL_BASE, PILL_STATIC)} title={title}>
      <span className={cn('w-1.5 h-1.5 rounded-full', dotClassName)} />
      {children}
    </span>
  );
}

function RolePill({ form, disabled }: { form: UserProfileForm; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const role = form.values.role;
  const label = ROLE_LABELS[role] ?? 'Citoyen';
  const dot = ROLE_DOT_COLOR[role] ?? 'bg-white';

  return (
    <InlineCellPopover
      isOpen={open}
      onOpenChange={setOpen}
      disabled={disabled}
      panelMinWidth={192}
      trigger={
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Rôle : ${label}`}
          disabled={disabled}
          className={cn(PILL_BASE, PILL_EDITABLE, form.isDirty('role') && PILL_DIRTY)}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />
          {label}
          <ChevronDown className="w-3 h-3 opacity-80" aria-hidden />
        </button>
      }
    >
      <div role="listbox" aria-label="Rôle" className="py-1">
        {ROLE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={option.value === role}
            onClick={() => { form.setValue('role', option.value); setOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm flex items-center justify-between gap-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span className="flex items-center gap-2">
              <span className={cn('w-1.5 h-1.5 rounded-full', ROLE_DOT_COLOR[option.value] ?? 'bg-gray-300')} />
              {option.label}
            </span>
            <Check className={cn('w-3.5 h-3.5', option.value === role ? 'opacity-100' : 'opacity-0')} aria-hidden />
          </button>
        ))}
      </div>
    </InlineCellPopover>
  );
}

function TogglePill({
  checked, onToggle, ariaLabel, text, trackOn, dirty, disabled,
}: {
  checked: boolean;
  onToggle: () => void;
  ariaLabel: string;
  text: string;
  trackOn: string;
  dirty: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onToggle}
      className={cn(PILL_BASE, PILL_EDITABLE, dirty && PILL_DIRTY)}
    >
      <span className={cn('relative inline-block w-6 h-3.5 rounded-full transition-colors motion-reduce:transition-none', checked ? trackOn : 'bg-white/30')}>
        <span
          className={cn(
            'absolute left-0 top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-transform motion-reduce:transition-none',
            checked ? 'translate-x-[12px]' : 'translate-x-0.5',
          )}
        />
      </span>
      {text}
    </button>
  );
}

export interface ProfileBannerProps {
  record: BackendUser;
  /** Nom d'affichage de l'enregistrement enregistré (pas du brouillon). */
  name: string;
  mode: ProfileMode;
  form: UserProfileForm;
  access: ProfileFieldAccess;
  disabled?: boolean;
  onBack: () => void;
  onEdit: () => void;
}

export function ProfileBanner({
  record, name, mode, form, access, disabled, onBack, onEdit,
}: ProfileBannerProps) {
  const editing = mode === 'edit';
  const v = form.values;

  const canName = editing && (access.canEditField('firstName') || access.canEditField('lastName'));
  const canRole = editing && access.canEditField('role');
  const canActive = editing && access.canEditField('isActive');
  const canVerified = editing && access.canEditField('isVerified');

  // L'avatar suit la saisie : on voit tout de suite l'effet d'un changement de nom.
  const shownName = editing
    ? getUserDisplayName({ id: record.id, firstName: v.firstName, lastName: v.lastName, username: record.username })
    : name;

  const roleLabel = (record.role && ROLE_LABELS[record.role]) || 'Citoyen';
  const roleDot = (record.role && ROLE_DOT_COLOR[record.role]) || 'bg-white';
  const lockedTitle = (field: 'role' | 'isActive' | 'isVerified') => (editing ? access.lockReason(field) ?? undefined : undefined);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5B4DFF] via-[#7B61FF] to-[#1A1F4D] px-6 py-8 sm:px-10 sm:py-10">
      <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%)]" />

      <div className="relative flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour à la liste"
          className="p-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        {!editing && access.canEditAny && (
          <Button data-edit-button="" type="button" variant="glass" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={onEdit}>
            Modifier
          </Button>
        )}
      </div>

      <div className="relative flex flex-col items-center text-center mt-2">
        <InitialsAvatar initials={getInitials(shownName)} sizePx={88} className="border-4 border-white/30 shadow-lg text-2xl" />

        {canName ? (
          <>
            <h1 className="sr-only">Modifier — {name}</h1>
            <div className="mt-4 grid grid-cols-2 gap-4 w-full max-w-md">
              <ProfileTextInput
                variant="banner"
                label="Prénom"
                aria-label="Prénom"
                placeholder="Prénom"
                value={v.firstName}
                disabled={disabled || !access.canEditField('firstName')}
                invalid={Boolean(form.errors.firstName)}
                id="profile-field-firstName"
                onChange={(e) => form.setValue('firstName', e.target.value)}
              />
              <ProfileTextInput
                variant="banner"
                label="Nom"
                aria-label="Nom"
                placeholder="Nom"
                value={v.lastName}
                disabled={disabled || !access.canEditField('lastName')}
                invalid={Boolean(form.errors.lastName)}
                id="profile-field-lastName"
                onChange={(e) => form.setValue('lastName', e.target.value)}
              />
            </div>
            {(form.errors.firstName || form.errors.lastName) && (
              <p role="alert" className="mt-2 text-xs font-medium text-white bg-red-500/70 rounded-lg px-2 py-1">
                {form.errors.firstName ?? form.errors.lastName}
              </p>
            )}
          </>
        ) : (
          <h1 className="mt-4 text-2xl font-bold text-white font-display truncate max-w-full">{shownName}</h1>
        )}

        <p className="mt-1 text-sm text-white/70 inline-flex items-center gap-1.5">
          @{record.username}
          {editing && (
            <span title="Le nom d'utilisateur n'est pas modifiable">
              <Lock className="w-3 h-3" aria-hidden />
              <span className="sr-only">Le nom d'utilisateur n'est pas modifiable</span>
            </span>
          )}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          {canRole ? (
            <RolePill form={form} disabled={disabled} />
          ) : (
            <StatusPill dotClassName={editing ? (ROLE_DOT_COLOR[v.role] ?? 'bg-white') : roleDot} title={lockedTitle('role')}>
              {editing ? (ROLE_LABELS[v.role] ?? 'Citoyen') : roleLabel}
            </StatusPill>
          )}

          {canActive ? (
            <TogglePill
              checked={v.isActive}
              onToggle={() => form.setValue('isActive', !v.isActive)}
              ariaLabel="Compte actif"
              text={v.isActive ? 'Actif' : 'Inactif'}
              trackOn="bg-emerald-400"
              dirty={form.isDirty('isActive')}
              disabled={disabled}
            />
          ) : (
            <StatusPill dotClassName={record.isActive === false ? 'bg-gray-300' : 'bg-emerald-400'} title={lockedTitle('isActive')}>
              {record.isActive === false ? 'Inactif' : 'Actif'}
            </StatusPill>
          )}

          {canVerified ? (
            <TogglePill
              checked={v.isVerified}
              onToggle={() => form.setValue('isVerified', !v.isVerified)}
              ariaLabel="Compte vérifié"
              text={v.isVerified ? 'Vérifié' : 'Non vérifié'}
              trackOn="bg-sky-400"
              dirty={form.isDirty('isVerified')}
              disabled={disabled}
            />
          ) : (
            <StatusPill dotClassName={record.isVerified ? 'bg-sky-400' : 'bg-gray-300'} title={lockedTitle('isVerified')}>
              {record.isVerified ? 'Vérifié' : 'Non vérifié'}
            </StatusPill>
          )}
        </div>
      </div>
    </div>
  );
}
