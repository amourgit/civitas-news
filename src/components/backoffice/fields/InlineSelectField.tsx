// ============================================================
// src/components/backoffice/fields/InlineSelectField.tsx
// Contrôle compact pour éditer un champ `select` (options statiques du
// registre, ex: statut/type/visibilité) directement dans une cellule
// du tableau — pendant équivalent de <select> du formulaire, mais en
// menu déroulant cliquable pour rester compact dans une colonne.
// ============================================================

import React, { useState } from 'react';
import { Check, ChevronDown, Loader2, X } from 'lucide-react';
import { InlineCellPopover } from './InlineCellPopover';
import type { FieldOption } from '../registry/types';

export interface InlineSelectFieldProps {
  options: FieldOption[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  nullable?: boolean;
  disabled?: boolean;
  isSaving?: boolean;
  placeholder?: string;
}

export const InlineSelectField: React.FC<InlineSelectFieldProps> = ({
  options,
  value,
  onChange,
  nullable = true,
  disabled,
  isSaving,
  placeholder = '— Sélectionner —',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <InlineCellPopover
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      disabled={disabled || isSaving}
      panelMinWidth={192}
      triggerClassName="w-full"
      trigger={
        <button
          type="button"
          disabled={disabled || isSaving}
          className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
            disabled
              ? 'text-gray-700 dark:text-gray-200'
              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60 cursor-pointer'
          }`}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          {!disabled && (isSaving ? (
            <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-gray-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-gray-400" />
          ))}
        </button>
      }
    >
      <div className="max-h-56 overflow-y-auto py-1">
        {nullable && (
          <button
            type="button"
            onClick={() => {
              onChange(undefined);
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-400 italic hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
          >
            <X className="w-3.5 h-3.5" />
            Aucun(e)
          </button>
        )}
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              setIsOpen(false);
            }}
            className={`w-full text-left px-3 py-2 text-sm truncate transition-colors flex items-center justify-between gap-2 ${
              option.value === value
                ? 'bg-[#5B4DFF]/10 text-[#5B4DFF] font-semibold'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <span className="truncate">{option.label}</span>
            {option.value === value && <Check className="w-3.5 h-3.5 shrink-0" />}
          </button>
        ))}
      </div>
    </InlineCellPopover>
  );
};
