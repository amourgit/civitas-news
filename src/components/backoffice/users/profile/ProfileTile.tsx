// ============================================================
// src/components/backoffice/users/profile/ProfileTile.tsx
// Un cadre de la grille d'informations. Selon `def.type` (voir
// userProfile.schema.ts) :
//   field   -> valeur en lecture ; CHAMP en édition (si permis) ;
//   system  -> donnée système, jamais modifiable (atténuée en édition) ;
//   secret  -> mot de passe : grisé en permanence, étoiles à la place
//              du contenu, en lecture comme en édition.
// ============================================================

import React from 'react';
import type { BackendUser } from '../../../../types/models/backend.types';
import { TileFrame } from './TileFrame';
import { ProfileFieldEditor, fieldInputId, fieldErrorId } from './ProfileFieldEditor';
import { useReferentielNom } from './useReferentielNom';
import { formatDateOnly } from './userProfile.logic';
import {
  EDITABLE_FIELDS, PASSWORD_MASK,
  type FieldTileDef, type ProfileTileDef, type SecretTileDef, type SystemTileDef,
} from './userProfile.schema';
import type { UserProfileForm } from './useUserProfileDraft';
import type { ProfileFieldAccess } from './useProfileFieldAccess';

export type ProfileMode = 'view' | 'edit';

export interface ProfileTileProps {
  def: ProfileTileDef;
  record: BackendUser;
  mode: ProfileMode;
  form: UserProfileForm;
  access: ProfileFieldAccess;
  /** Sauvegarde en cours : les champs sont gelés. */
  disabled?: boolean;
}

const VALUE_CLASS = 'text-sm font-semibold text-gray-900 dark:text-white truncate';
const EMPTY_CLASS = 'text-sm font-medium text-gray-400 dark:text-gray-500 truncate';

export function ProfileTile({ def, ...rest }: ProfileTileProps) {
  switch (def.type) {
    case 'secret':
      return <SecretTile tile={def} mode={rest.mode} />;
    case 'system':
      return <SystemTile tile={def} record={rest.record} mode={rest.mode} />;
    case 'field':
      return <FieldTile tile={def} {...rest} />;
  }
}

function SecretTile({ tile, mode }: { tile: SecretTileDef; mode: ProfileMode }) {
  return (
    <TileFrame
      data-tile={tile.id}
      icon={tile.icon}
      label={tile.label}
      tone="secret"
      lockReason={tile.reason}
      footnote={mode === 'edit' ? 'Non modifiable ici' : undefined}
    >
      {/* Aucune valeur réelle n'existe côté front (le backend ne renvoie
          jamais le mot de passe) : les étoiles sont un simple masque. */}
      <p
        aria-label="Mot de passe masqué"
        className="text-sm font-semibold tracking-[0.2em] text-gray-400 dark:text-gray-500"
      >
        {PASSWORD_MASK}
      </p>
    </TileFrame>
  );
}

function SystemTile({ tile, record, mode }: { tile: SystemTileDef; record: BackendUser; mode: ProfileMode }) {
  const value = tile.read(record);
  if (!value) return null;
  return (
    <TileFrame data-tile={tile.id} icon={tile.icon} label={tile.label} tone={mode === 'edit' ? 'system' : 'view'}>
      <p className={VALUE_CLASS}>{value}</p>
    </TileFrame>
  );
}

function FieldTile({
  tile, record, mode, form, access, disabled,
}: Omit<ProfileTileProps, 'def'> & { tile: FieldTileDef }) {
  const def = EDITABLE_FIELDS[tile.field];
  const isFk = def.kind === 'fk';
  const fkId = isFk ? (record[tile.field as 'etablissement' | 'organisation'] ?? null) : null;
  const fkNom = useReferentielNom(isFk ? def.fkTarget! : null, fkId);

  const raw = record[tile.field as keyof BackendUser];
  let display: string | null;
  if (isFk) display = fkId === null ? null : (fkNom ?? '…');
  else if (def.kind === 'date') display = typeof raw === 'string' && raw ? formatDateOnly(raw) : null;
  else display = typeof raw === 'string' && raw.trim() ? raw : null;

  if (mode === 'view' && tile.hideWhenEmptyInView && !display) return null;

  const valueNode = (
    <p className={display ? VALUE_CLASS : EMPTY_CLASS}>{display ?? tile.emptyLabel ?? '—'}</p>
  );

  if (mode === 'view') {
    return <TileFrame data-tile={tile.id} icon={tile.icon} label={def.label} tone="view">{valueNode}</TileFrame>;
  }

  const reason = access.lockReason(tile.field);
  if (reason) {
    return (
      <TileFrame data-tile={tile.id} icon={tile.icon} label={def.label} tone="locked" lockReason={reason}>
        {valueNode}
      </TileFrame>
    );
  }

  const error = form.errors[tile.field];
  return (
    <TileFrame
      data-tile={tile.id}
      icon={tile.icon}
      label={def.label}
      tone="editable"
      // Le déclencheur d'un FK (bouton) n'est pas un contrôle « labellisable » par for/id.
      labelFor={isFk ? undefined : fieldInputId(tile.field)}
      dirty={form.isDirty(tile.field)}
      error={error}
      errorId={fieldErrorId(tile.field)}
    >
      <ProfileFieldEditor
        field={tile.field}
        value={form.values[tile.field]}
        onChange={(v) => form.setValue(tile.field, v as never)}
        invalid={Boolean(error)}
        disabled={disabled}
      />
    </TileFrame>
  );
}
