// ============================================================
// src/components/backoffice/BackofficeDataTable.tsx
// Tableau liste générique — un seul composant pour TOUTES les tables du
// backoffice, colonnes pilotées par `model.fields` (celles sans
// `hiddenInList`). Recherche et pagination côté client, même
// convention que features/administration/components/AdminDataTable.tsx
// (le reste de l'app n'utilise pas de pagination serveur pour ces vues
// d'administration).
// ============================================================

import React, { useMemo, useState } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Pencil, Trash2, Inbox } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import type { FieldDef, ModelDef } from './registry/types';
import { formatListDate } from './utils';

const PAGE_SIZE = 12;

export interface BackofficeDataTableProps<TRecord extends Record<string, unknown>> {
  model: ModelDef<TRecord>;
  records: TRecord[];
  isLoading: boolean;
  canManage: boolean;
  onCreate: () => void;
  onOpen: (record: TRecord) => void;
  onDelete: (record: TRecord) => void;
}

function renderCell<TRecord extends Record<string, unknown>>(field: FieldDef<TRecord>, record: TRecord): React.ReactNode {
  const raw = (record as Record<string, unknown>)[field.name];

  if (field.renderList) return field.renderList(raw, record);

  switch (field.type) {
    case 'boolean':
      return raw ? (
        <Badge variant="success" size="sm">Oui</Badge>
      ) : (
        <Badge variant="default" size="sm">Non</Badge>
      );
    case 'fk': {
      if (raw && typeof raw === 'object') {
        const nested = raw as Record<string, unknown>;
        const label = (nested.nom ?? nested.titre ?? nested.nomAffiche ?? nested.id) as string | undefined;
        return label ?? '—';
      }
      return raw ? String(raw) : '—';
    }
    case 'date':
    case 'datetime':
      return formatListDate(raw);
    case 'image':
      return raw && typeof raw === 'string'
        ? <img src={raw} alt="" className="w-9 h-9 rounded-lg object-cover" />
        : '—';
    case 'tags':
      return Array.isArray(raw) && raw.length > 0 ? `${raw.length} tag${raw.length > 1 ? 's' : ''}` : '—';
    case 'select': {
      const option = field.options?.find((o) => o.value === raw);
      return option?.label ?? (raw ? String(raw) : '—');
    }
    case 'json-readonly':
      return raw !== undefined && raw !== null ? String(raw) : '—';
    default:
      if (raw === null || raw === undefined || raw === '') return '—';
      if (typeof raw === 'string' && raw.length > 60) return `${raw.slice(0, 60)}…`;
      return String(raw);
  }
}

export function BackofficeDataTable<TRecord extends Record<string, unknown>>({
  model, records, isLoading, canManage, onCreate, onOpen, onDelete,
}: BackofficeDataTableProps<TRecord>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const columns = useMemo(() => model.fields.filter((f) => !f.hiddenInList), [model.fields]);

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
                  onClick={() => onOpen(record)}
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col.name} className="px-4 py-3 text-gray-700 dark:text-gray-200 max-w-xs truncate">
                      {renderCell(col, record)}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); onOpen(record); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#5B4DFF] hover:bg-[#5B4DFF]/10 transition-colors"
                        aria-label="Ouvrir"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {canManage && model.capabilities.delete && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(record); }}
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
