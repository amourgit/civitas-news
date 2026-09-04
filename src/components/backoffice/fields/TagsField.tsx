// ============================================================
// src/components/backoffice/fields/TagsField.tsx
// Champ "tags" à saisie libre (Entrée/virgule pour valider) — utilisé
// par `BackofficeRecordForm` (page d'édition) ET
// `BackofficeEditableCell` (édition en ligne dans le tableau).
// ============================================================

import React, { useState } from 'react';
import { X } from 'lucide-react';

export interface TagsFieldProps {
  id?: string;
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function TagsField({ id, value, onChange, disabled, autoFocus }: TagsFieldProps) {
  const [draft, setDraft] = useState('');
  const commit = () => {
    const clean = draft.trim();
    if (clean && !value.includes(clean)) onChange([...value, clean]);
    setDraft('');
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#242A5C] border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-[#5B4DFF]">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#5B4DFF]/10 text-[#5B4DFF] text-xs font-semibold">
          {tag}
          {!disabled && (
            <X className="w-3 h-3 cursor-pointer" onClick={() => onChange(value.filter((t) => t !== tag))} />
          )}
        </span>
      ))}
      {!disabled && (
        <input
          id={id}
          autoFocus={autoFocus}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
          placeholder={value.length === 0 ? 'Ajouter un tag, Entrée pour valider…' : 'Ajouter…'}
          className="flex-1 min-w-[8rem] bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400 py-0.5"
        />
      )}
    </div>
  );
}
