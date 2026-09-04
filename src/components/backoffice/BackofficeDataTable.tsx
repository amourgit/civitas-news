// ============================================================
// src/components/backoffice/BackofficeDataTable.tsx
// Tableau liste générique — un seul composant pour TOUTES les tables du
// backoffice, colonnes pilotées par `model.fields` (celles sans
// `hiddenInList`). Recherche et pagination côté client, même
// convention que features/administration/components/AdminDataTable.tsx
// (le reste de l'app n'utilise pas de pagination serveur pour ces vues
// d'administration).
//
// Édition en ligne : chaque cellule éditable (voir
// `BackofficeEditableCell`) se modifie directement dans le tableau —
// select/fk en menu déroulant chargeant les vraies données métier,
// booléen en interrupteur, texte/nombre/date en saisie in-situ,
// texte long/tags en petit panneau Enregistrer/Annuler. La navigation
// vers la page de détail (bouton crayon) reste disponible pour les
// champs non éditables en ligne (image, contenu enrichi complet,
// onglets `DetailExtras`...).
// ============================================================

import React, { useMemo, useState } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Pencil, Trash2, Inbox } from 'lucide-react';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { BackofficeEditableCell } from './BackofficeEditableCell';
import type { ModelDef } from './registry/types';

const PAGE_SIZE = 12;

export interface BackofficeDataTableProps<TRecord extends Record<string, unknown>> {
  model: ModelDef<TRecord>;
  records: TRecord[];
  isLoading: boolean;
  canManage: boolean;
  onCreate: () => void;
  onOpen: (record: TRecord) => void;
  onDelete: (record: TRecord) => void;
  /** Appelé quand une cellule est modifiée en ligne avec succès, avec
   * l'enregistrement renvoyé par l'API — le parent doit le fusionner
   * dans sa liste locale (voir BackofficeListPage). */
  onRecordUpdated: (record: TRecord) => void;
}

export function BackofficeDataTable<TRecord extends Record<string, unknown>>({
  model, records, isLoading, canManage, onCreate, onOpen, onDelete, onRecordUpdated,
}: BackofficeDataTableProps<TRecord>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const columns = useMemo(() => model.fields.filter((f) => !f.hiddenInList), [model.fields]);
  const canEditInline = canManage && model.capabilities.edit && !!model.data.update;

  const filtered = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.trim().toLowerCase();
    const searchFields = model.searchFields ?? columns.map((c) => c.name);
    return records.filter((record) =>
      searchFields.some((key) => {
        const value = (record as Record<string, unknown>)[key as string];
        return typeof value === 'string' && value.toLowerCase().includes(q);
      }),
    );
  }, [records, search, model.searchFields, columns]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={`Rechercher parmi ${records.length} ${model.labelPlural.toLowerCase()}…`}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#242A5C] border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]"
          />
        </div>
        {canManage && model.capabilities.create && (
          <Button variant="primary" size="md" icon={<Plus className="w-4 h-4" />} onClick={onCreate}>
            Ajouter {model.labelSingular.toLowerCase()}
          </Button>
        )}
      </div>

      {canEditInline && pageItems.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 -mt-1.5">
          Cliquez sur une cellule pour la modifier directement.
        </p>
      )}

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#161B45] text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {columns.map((col) => (
                  <th key={col.name} className="px-4 py-3 whitespace-nowrap">{col.label}</th>
                ))}
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={columns.length + 1} className="px-4 py-3">
                    <Skeleton variant="text" height={20} />
                  </td>
                </tr>
              ))}

              {!isLoading && pageItems.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Inbox className="w-8 h-8" />
                      <p className="text-sm">
                        {search ? 'Aucun résultat pour cette recherche.' : `Aucun(e) ${model.labelSingular.toLowerCase()} pour le moment.`}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && pageItems.map((record) => (
                <tr
                  key={String((record as Record<string, unknown>).id)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.name} className="px-4 py-3 text-gray-700 dark:text-gray-200 max-w-xs align-middle">
                      <BackofficeEditableCell
                        model={model}
                        field={col}
                        record={record}
                        canEdit={canEditInline}
                        onSaved={onRecordUpdated}
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onOpen(record)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#5B4DFF] hover:bg-[#5B4DFF]/10 transition-colors"
                        aria-label="Ouvrir"
                        title="Ouvrir la fiche complète"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {canManage && model.capabilities.delete && (
                        <button
                          onClick={() => onDelete(record)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Page {currentPage} / {totalPages} — {filtered.length} résultat{filtered.length > 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
