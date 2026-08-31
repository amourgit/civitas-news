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

export const NewsFiltres: React.FC<SujetFiltresProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedType,
  onSelectType,
}) => {
  return (
    <div className="flex flex-col gap-2 py-1.5">
      {/* Category Chips Horizontal Scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <span className="text-[10px] sm:text-xs font-extrabold text-white/60 uppercase shrink-0 flex items-center gap-1 mr-0.5">
          <Filter className="w-3 h-3 text-white/80" /> Thèmes :
        </span>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-white text-[#5B4DFF] shadow-sm'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Type Sub-filters */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1 border-t border-white/15">
        {TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelectType(t.id)}
            className={`px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
              selectedType === t.id
                ? 'bg-white text-slate-900 font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export const SujetFiltres = NewsFiltres;
export type NewsFiltresProps = SujetFiltresProps;

