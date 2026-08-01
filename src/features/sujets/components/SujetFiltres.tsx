import React from 'react';
import { Filter } from 'lucide-react';
import { SujetType } from '../../../types/global.types';

export interface SujetFiltresProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedType: SujetType | 'all';
  onSelectType: (t: SujetType | 'all') => void;
  selectedProvince?: string;
  onSelectProvince?: (prov: string) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'Tous les Sujets' },
  { id: 'cat-transports', label: 'Transports & Mobilité' },
  { id: 'cat-numerique', label: 'Innovation & IA' },
  { id: 'cat-emploi', label: 'Carrière & Emploi' },
  { id: 'cat-sante', label: 'Alimentation & Santé' },
];

const TYPES: Array<{ id: SujetType | 'all'; label: string }> = [
  { id: 'all', label: 'Tous les formats' },
  { id: 'consultation', label: 'Consultations' },
  { id: 'projet', label: 'Projets' },
  { id: 'evenement', label: 'Événements' },
  { id: 'petition', label: 'Pétitions' },
  { id: 'sondage', label: 'Sondages' },
  { id: 'annonce', label: 'Annonces' },
];

export const SujetFiltres: React.FC<SujetFiltresProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedType,
  onSelectType,
}) => {
  return (
    <div className="flex flex-col gap-3 py-2">
      {/* Category Chips Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <span className="text-xs font-bold text-gray-500 uppercase shrink-0 flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5" /> Thèmes :
        </span>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-2.5 py-1 rounded-none text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#5B4DFF] text-white shadow-sm'
                  : 'bg-white dark:bg-[#1A1F4D] text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800 hover:border-gray-300'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Type Sub-filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-200/60 dark:border-gray-800/60">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectType(t.id)}
              className={`px-2 py-0.5 rounded-none text-xs font-medium transition-all whitespace-nowrap ${
                selectedType === t.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
