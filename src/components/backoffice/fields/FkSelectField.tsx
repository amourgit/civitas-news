// ============================================================
// src/components/backoffice/fields/FkSelectField.tsx
// Le composant central de la "liaison de données entre tables" du
// backoffice : un menu déroulant avec recherche, dont les options sont
// résolues dynamiquement depuis la table cible du registre
// (`field.fkTarget`) via `model.data.list()` — jamais d'appel HTTP
// direct depuis ce composant.
//
// Deux modes :
// - mode "formulaire" (défaut) : bloc pleine largeur avec label, tel
//   qu'utilisé par `BackofficeRecordForm`.
// - mode `compact` : déclencheur compact + panneau en portail (voir
//   `InlineCellPopover`), pour l'édition en ligne dans une cellule du
//   tableau liste (`BackofficeEditableCell`) — même source de données,
//   même logique de sélection, présentation resserrée.
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Loader2, X, Search, Check } from 'lucide-react';
import { getModel } from '../registry';
import type { ModelKey } from '../registry/types';
import { InlineCellPopover } from './InlineCellPopover';

export interface FkSelectFieldProps {
  label: string;
  /** Table cible dans le registre (ex: 'categorie', 'etablissement'...). */
  fkTarget: ModelKey;
  /** Nom du champ à afficher pour chaque option (défaut : 'nom', puis 'titre'). */
  labelField?: string;
  /** Valeur sélectionnée — id sous forme de chaîne, ou `undefined`/`''` si aucune. */
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  required?: boolean;
  nullable?: boolean;
  error?: string;
  disabled?: boolean;
  /** Rendu compact (déclencheur + panneau portail) pour une cellule de tableau. */
  compact?: boolean;
  /** Indicateur d'enregistrement en cours (mode compact) — désactive le contrôle. */
  isSaving?: boolean;
}

interface Option {
  id: string;
  label: string;
}

/** Devine un libellé lisible pour une option dont le champ `labelField`
 * n'existe pas (jeu de données hétérogène) — retombe sur les clés
 * usuelles du projet plutôt que d'afficher un simple id opaque. */
function resolveLabel(record: Record<string, unknown>, labelField?: string): string {
  const candidates = [labelField, 'nom', 'titre', 'nomAffiche', 'username', 'libelle', 'label'].filter(
    (key): key is string => Boolean(key),
  );
  for (const key of candidates) {
    const value = record[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return `#${String(record.id)}`;
}

/** Charge les options d'une table cible du registre — logique de
 * récupération partagée par les deux modes de rendu ci-dessous. */
function useFkOptions(fkTarget: ModelKey, labelField: string | undefined) {
  const [options, setOptions] = useState<Option[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const targetModel = getModel(fkTarget);

  useEffect(() => {
    let cancelled = false;
    if (!targetModel) {
      setLoadError(`Table "${fkTarget}" introuvable dans le registre du backoffice.`);
      return undefined;
    }
    targetModel.data
      .list()
      .then((records) => {
        if (cancelled) return;
        setOptions(
          (records as Record<string, unknown>[]).map((record) => ({
            id: String(record.id),
            label: resolveLabel(record, labelField),
          })),
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Chargement impossible.');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fkTarget]);

  return { options, loadError, targetModel };
}

export const FkSelectField: React.FC<FkSelectFieldProps> = ({
  label,
  fkTarget,
  labelField,
  value,
  onChange,
  required,
  nullable = true,
  error,
  disabled,
  compact = false,
  isSaving = false,
}) => {
  const { options, loadError, targetModel } = useFkOptions(fkTarget, labelField);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const fieldId = `bo-fk-${fkTarget}-${label.toLowerCase().replace(/\s+/g, '-')}`;

  const selected = useMemo(() => options?.find((o) => o.id === value), [options, value]);

  const filtered = useMemo(() => {
    if (!options) return [];
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const isDisabled = disabled || isSaving || !options;

  const optionsPanel = (
    <>
      {options && options.length > 6 && (
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
      )}
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
            — Aucun(e) —
          </button>
        )}
        {filtered.length === 0 && (
          <p className="px-4 py-2 text-sm text-gray-400">Aucun résultat.</p>
        )}
        {filtered.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              onChange(option.id);
              setIsOpen(false);
              setQuery('');
            }}
            className={`w-full text-left px-4 py-2 text-sm truncate transition-colors flex items-center justify-between gap-2 ${
              option.id === value
                ? 'bg-[#5B4DFF]/10 text-[#5B4DFF] font-semibold'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <span className="truncate">{option.label}</span>
            {option.id === value && compact && <Check className="w-3.5 h-3.5 shrink-0" />}
          </button>
        ))}
      </div>
    </>
  );

  if (compact) {
    return (
      <div className="flex flex-col gap-1 w-full">
        <InlineCellPopover
          isOpen={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setQuery('');
          }}
          disabled={isDisabled}
          panelMinWidth={224}
          triggerClassName="w-full"
          trigger={
            <button
              type="button"
              aria-label={label}
              disabled={isDisabled}
              className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
                isDisabled
                  ? 'text-gray-500 dark:text-gray-400'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60 cursor-pointer'
              }`}
            >
              <span className="truncate">
                {!options && !loadError && 'Chargement…'}
                {loadError && 'Erreur'}
                {options && !loadError && (selected ? selected.label : '—')}
              </span>
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-gray-400" />
              ) : !options && !loadError ? (
                <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-gray-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 shrink-0 text-gray-400" />
              )}
            </button>
          }
        >
          {optionsPanel}
        </InlineCellPopover>
        {loadError && <span className="text-xs text-red-500">{loadError}</span>}
      </div>
    );
  }

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
        disabled={isDisabled}
        triggerClassName="w-full"
        trigger={
          <button
            id={fieldId}
            type="button"
            disabled={isDisabled}
            className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#242A5C] border text-sm text-left transition-all focus:outline-none focus:ring-2 focus:ring-[#5B4DFF] ${
              error ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
            } ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={selected ? 'text-gray-900 dark:text-white truncate' : 'text-gray-400 truncate'}>
              {!options && !loadError && 'Chargement…'}
              {loadError && 'Erreur de chargement'}
              {options && !loadError && (selected ? selected.label : `Sélectionner ${targetModel?.labelSingular ?? ''}…`)}
            </span>
            <span className="flex items-center gap-1 shrink-0">
              {nullable && selected && !disabled && (
                <X
                  className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(undefined);
                  }}
                />
              )}
              {!options && !loadError ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </span>
          </button>
        }
      >
        {optionsPanel}
      </InlineCellPopover>

      {loadError && <span className="text-xs text-red-500">{loadError}</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};
