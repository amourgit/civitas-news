// ============================================================
// src/components/ui/SearchableOptionsList.tsx
// Liste d'options avec champ de recherche intégré -- même mécanique
// et même habillage visuel que le combobox recherchable du backoffice
// (voir src/components/backoffice/fields/SelectComboboxField.tsx) :
// recherche en tête de liste, coche affichée sur l'option sélectionnée
// (espace toujours réservé, opacité 0/100).
//
// Volontairement dénué de trigger/portail propre (contrairement à
// SelectComboboxField) pour rester réutilisable à l'intérieur de
// N'IMPORTE QUEL panneau déjà positionné -- notamment les popovers
// pastille de la création de News (voir FieldChipPopover +
// MetaFieldsRow), qui gèrent déjà leur propre portail/positionnement.
// ============================================================

import React, { useMemo, useState } from 'react';
import { Check, Search, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SearchableOption {
  value: string;
  label: string;
  /** Pastille de couleur (ex: couleur de catégorie), alternative à `icon`. */
  swatch?: string;
  /** Icône (ex: type de News), alternative à `swatch`. */
  icon?: LucideIcon;
}

export interface SearchableOptionsListProps {
  options: SearchableOption[];
  /** Valeur sélectionnée, ou `undefined`/`''`/`null` si aucune. */
  value?: string | null;
  onSelect: (value: string) => void;
  searchPlaceholder?: string;
  emptyLabel?: string;
  /** Libellé de la ligne "vider la sélection" (ex: "Aucune") -- absent = champ non annulable. */
  nullableLabel?: string;
  onClear?: () => void;
  autoFocusSearch?: boolean;
  /** Masque la recherche en dessous de ce nombre d'options (défaut : toujours visible). */
  minOptionsForSearch?: number;
}

/** Liste d'options avec champ de recherche intégré (réforme du bouton de sélection, voir SelectComboboxField). */
export const SearchableOptionsList: React.FC<SearchableOptionsListProps> = ({
  options,
  value,
  onSelect,
  searchPlaceholder = 'Rechercher…',
  emptyLabel = 'Aucun résultat.',
  nullableLabel,
  onClear,
  autoFocusSearch = true,
  minOptionsForSearch = 0,
}) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const showSearch = options.length >= minOptionsForSearch;

  return (
    <div className="flex flex-col">
      {showSearch && (
        <div className="flex items-center gap-2 px-2 pb-2 mb-1 border-b border-gray-100 dark:border-gray-800">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            autoFocus={autoFocusSearch}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
          />
        </div>
      )}
      <div className="max-h-60 overflow-y-auto space-y-0.5">
        {nullableLabel && (
          <button
            type="button"
            onClick={onClear}
            className="flex w-full items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-gray-400 italic hover:bg-gray-50 dark:hover:bg-white/5"
          >
            {nullableLabel}
            <Check className={cn('w-3.5 h-3.5 shrink-0', !value ? 'opacity-100' : 'opacity-0')} />
          </button>
        )}
        {filtered.length === 0 && <p className="px-2.5 py-2 text-sm text-gray-400">{emptyLabel}</p>}
        {filtered.map((opt) => {
          const OptIcon = opt.icon;
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium transition-colors',
                active
                  ? 'bg-[#5B4DFF]/10 text-[#4739E0] dark:text-[#B8AFFF]'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5',
              )}
            >
              {OptIcon && <OptIcon className="w-4 h-4 shrink-0 opacity-70" />}
              {opt.swatch && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: opt.swatch }} />}
              <span className="truncate flex-1">{opt.label}</span>
              <Check className={cn('w-3.5 h-3.5 shrink-0', active ? 'opacity-100' : 'opacity-0')} />
            </button>
          );
        })}
      </div>
    </div>
  );
};
