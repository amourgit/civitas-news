// ============================================================
// src/components/backoffice/fields/SelectComboboxField.tsx
// Champ `select` du formulaire backoffice (field.type === 'select') —
// combobox recherchable qui remplace le <select> HTML natif.
//
// Même mécanique de panneau que ses voisins du dossier `fields/`
// (InlineCellPopover : déclencheur + portail positionné, fermeture au
// clic extérieur / Échap) et même vocabulaire visuel que
// FkSelectField (trigger plein-largeur avec label, anneau de focus
// #5B4DFF) — seule la liste change : recherche en tête de panneau,
// coche affichée sur l'option sélectionnée (espace toujours réservé,
// opacité 0/100), au lieu d'un simple menu de type <select>.
// ============================================================

import React, { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { InlineCellPopover } from './InlineCellPopover';
import type { FieldOption } from '../registry/types';
import { cn } from '../../../lib/utils';

export interface SelectComboboxFieldProps {
  label: string;
  options: FieldOption[];
  /** Valeur sélectionnée, ou `undefined`/`''` si aucune. */
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
}

export const SelectComboboxField: React.FC<SelectComboboxFieldProps> = ({
  label,
  options,
  value,
  onChange,
  required,
  disabled,
  error,
  placeholder = '— Sélectionner —',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const nullable = !required;
  const fieldId = `bo-combobox-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={fieldId} className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <InlineCellPopover
        isOpen={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) setQuery('');
        }}
        disabled={disabled}
        triggerClassName="w-full"
        trigger={
          <button
            id={fieldId}
            type="button"
            role="combobox"
            aria-expanded={isOpen}
            aria-label={label}
            disabled={disabled}
            className={cn(
              'w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#242A5C] border text-sm text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]',
              error ? 'border-red-400' : 'border-gray-200 dark:border-gray-700',
              disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
            )}
          >
            <span className={selected ? 'text-gray-900 dark:text-white truncate' : 'text-gray-400 truncate'}>
              {selected ? selected.label : placeholder}
            </span>
            <ChevronsUpDown className="w-4 h-4 shrink-0 opacity-50 text-gray-400" />
          </button>
        }
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-800">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="w-full bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
          />
        </div>
        <div className="max-h-56 overflow-y-auto py-1">
          {nullable && (
            <button
              type="button"
              onClick={() => {
                onChange(undefined);
                setIsOpen(false);
                setQuery('');
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-400 italic hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {placeholder}
            </button>
          )}
          {filtered.length === 0 && (
            <p className="px-4 py-2 text-sm text-gray-400">Aucun résultat.</p>
          )}
          {filtered.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
                setQuery('');
              }}
              className="w-full text-left px-4 py-2 text-sm truncate transition-colors flex items-center justify-between gap-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="truncate">{option.label}</span>
              <Check className={cn('w-3.5 h-3.5 shrink-0', option.value === value ? 'opacity-100' : 'opacity-0')} />
            </button>
          ))}
        </div>
      </InlineCellPopover>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};
