import React, { useState } from 'react';
import { Search, Plus, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

export interface AdminDataTableProps<T> {
  title: string;
  description?: string;
  columns: Column<T>[];
  data: T[];
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  searchPlaceholder?: string;
}

export function AdminDataTable<T extends { id: string }>({
  title,
  description,
  columns,
  data,
  onAdd,
  onEdit,
  onDelete,
  searchPlaceholder = 'Rechercher...',
}: AdminDataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const filteredData = data.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white dark:bg-[#1A1F4D] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
      {/* Header & Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white font-display">{title}</h2>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>

        {onAdd && (
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={onAdd}>
            Ajouter un élément
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-xs">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs border border-gray-200 dark:border-gray-700 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-700 dark:text-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-800/80 uppercase text-[10px] font-bold text-gray-500">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="p-3">
                  {col.header}
                </th>
              ))}
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                {columns.map((col) => (
                  <td key={col.key} className="p-3">
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </td>
                ))}
                <td className="p-3 text-right space-x-1">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(item)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-800">
        <span>
          Page {currentPage} sur {totalPages} ({filteredData.length} résultats)
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
