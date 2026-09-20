// ============================================================
// src/components/backoffice/users/profile/ProfileEditBar.tsx
// Barre d'actions de l'édition, collante en bas de l'écran : sur mobile
// la grille fait plusieurs écrans de haut, l'enregistrement doit rester
// à portée sans remonter. Décalée au-dessus du dock mobile
// (fixed bottom-0, z-40) sous `sm`. « Enregistrer » est un bouton
// `submit` : Entrée dans un champ enregistre aussi.
// ============================================================

import React from 'react';
import { Save } from 'lucide-react';
import { Button } from '../../../ui/Button';

export interface ProfileEditBarProps {
  changeCount: number;
  isSaving: boolean;
  onCancel: () => void;
}

export function ProfileEditBar({ changeCount, isSaving, onCancel }: ProfileEditBarProps) {
  const status = changeCount === 0
    ? 'Aucune modification'
    : `${changeCount} modification${changeCount > 1 ? 's' : ''} non enregistrée${changeCount > 1 ? 's' : ''}`;

  return (
    <div
      role="region"
      aria-label="Actions d'édition"
      className="sticky bottom-[5.5rem] sm:bottom-4 z-30 flex items-center justify-between gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-[#1A1F4D]/90 backdrop-blur-md shadow-lg px-4 py-3"
    >
      <p aria-live="polite" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 min-w-0">
        {changeCount > 0 && <span className="w-2 h-2 rounded-full bg-[#5B4DFF] shrink-0" aria-hidden />}
        <span className="truncate">{status}</span>
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
          Annuler
        </Button>
        <Button type="submit" variant="primary" size="sm" isLoading={isSaving} disabled={changeCount === 0} icon={<Save className="w-3.5 h-3.5" />}>
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
