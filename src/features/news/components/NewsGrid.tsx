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
}

export const NewsGrid: React.FC<NewsGridProps> = ({
  newsList,
  sujets,
  isLoading = false,
  onResetFilters,
}) => {
  const list = newsList || sujets || [];

  if (isLoading) {
    return (
      <div className="w-full flex flex-col space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-2 rounded-none p-2 bg-white dark:bg-[#1A1F4D] border border-gray-200 dark:border-gray-800">
            <Skeleton variant="card" height={100} />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" height={20} />
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
    <div className="w-full flex flex-col space-y-2">
      {list.map((item) => (
        <NewsCard key={item.id} news={item} />
      ))}
    </div>
  );
};

export const SujetGrid = NewsGrid;
export type SujetGridProps = NewsGridProps;

