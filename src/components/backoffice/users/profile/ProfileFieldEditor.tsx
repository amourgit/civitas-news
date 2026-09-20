// ============================================================
// src/components/backoffice/users/profile/ProfileFieldEditor.tsx
// Éditeur de la VALEUR d'un cadre de la grille, choisi selon le `kind`
// déclaré dans le schéma. Il prend la place exacte du texte affiché en
// lecture. Les kinds `select` et `boolean` (rôle, actif, vérifié) sont
// rendus par la bannière (ProfileBanner), pas par la grille.
// ============================================================

import React from 'react';
import { FkSelectField } from '../../fields/FkSelectField';
import { ProfileTextInput } from './ProfileTextInput';
import { EDITABLE_FIELDS, type EditableField, type UserProfileDraft } from './userProfile.schema';

export const fieldInputId = (field: EditableField) => `profile-field-${field}`;
export const fieldErrorId = (field: EditableField) => `profile-error-${field}`;

export interface ProfileFieldEditorProps {
  field: EditableField;
  value: UserProfileDraft[EditableField];
  onChange: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
}

// Le déclencheur « compact » de FkSelectField est prévu pour une cellule
// de tableau (text-xs, léger retrait) : on l'aligne sur le corps de la
// valeur des autres cadres -- sélecteur descendant, plus fort que les
// utilitaires du déclencheur.
const FK_ALIGN =
  '-ml-2.5 [&_button]:text-sm [&_button]:font-semibold [&_button]:text-gray-900 dark:[&_button]:text-white';

export function ProfileFieldEditor({ field, value, onChange, invalid, disabled }: ProfileFieldEditorProps) {
  const def = EDITABLE_FIELDS[field];

  switch (def.kind) {
    case 'text':
    case 'email':
    case 'tel':
    case 'date':
      return (
        <ProfileTextInput
          id={fieldInputId(field)}
          label={def.label}
          type={def.kind === 'text' ? 'text' : def.kind}
          inputMode={def.kind === 'tel' ? 'tel' : undefined}
          value={String(value ?? '')}
          placeholder={def.placeholder}
          disabled={disabled}
          invalid={invalid}
          aria-describedby={invalid ? fieldErrorId(field) : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'fk':
      return (
        <div className={FK_ALIGN}>
          <FkSelectField
            compact
            label={def.label}
            fkTarget={def.fkTarget!}
            value={String(value ?? '') || undefined}
            onChange={(id) => onChange(id ?? '')}
            nullable
            disabled={disabled}
          />
        </div>
      );

    default:
      return null;
  }
}
