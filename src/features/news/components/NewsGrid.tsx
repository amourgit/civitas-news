import React from 'react';
import { News, Sujet } from '../../../types/global.types';
import { NewsCard } from './NewsCard';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';

export interface NewsGridProps {
  newsList?: News[];
  sujets?: News[];
  isLoading?: boolean;
  onResetFilters?: () => void;
  onOpenDetail?: (slug: string) => void;
}

// Motif bento répété tous les 5 éléments (2 cartes larges puis 3
// étroites), calqué sur le modèle fourni : à 6 colonnes (desktop), les
// 2 larges (col-span-3) remplissent une rangée, les 3 étroites
// (col-span-2) la suivante. Décliné à chaque palier pour que le bento
// reste visible même sur mobile (2 colonnes) plutôt que de retomber sur
// un simple empilement vertical.
function getBentoSpanClass(index: number): string {
  const isHero = index % 5 < 2;
  return isHero
    ? 'col-span-2 sm:col-span-3 lg:col-span-3'
    : 'col-span-1 sm:col-span-1 lg:col-span-2';
}

export const NewsGrid: React.FC<NewsGridProps> = ({
  newsList,
  sujets,
  isLoading = false,
  onResetFilters,
  onOpenDetail,
}) => {
  const list = newsList || sujets || [];

  if (isLoading) {
    return (
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 auto-rows-[480px] sm:auto-rows-[600px] lg:auto-rows-[800px] gap-3 sm:gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`rounded-2xl sm:rounded-3xl overflow-hidden ${getBentoSpanClass(i)}`}>
            <Skeleton variant="card" height="100%" />
          </div>
        ))}
      </div>
    );
  }

  if (!list.length) {
    return (
      <EmptyState
        title="Aucune news trouvée"
        description="Aucune publication, actualité ou sondage ne correspond à vos critères de recherche actuels."
        actionLabel="Réinitialiser les filtres"
        onAction={onResetFilters}
      />
    );
  }

  return (
    <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 auto-rows-[480px] sm:auto-rows-[600px] lg:auto-rows-[800px] gap-3 sm:gap-4">
      {list.map((item, index) => (
        <NewsCard key={item.id} news={item} onOpenDetail={onOpenDetail} className={getBentoSpanClass(index)} />
      ))}
    </div>
  );
};

export const SujetGrid = NewsGrid;
export type SujetGridProps = NewsGridProps;
