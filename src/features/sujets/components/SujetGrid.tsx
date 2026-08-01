import React from 'react';
import { Sujet } from '../../../types/global.types';
import { SujetCard } from './SujetCard';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';

export interface SujetGridProps {
  sujets: Sujet[];
  isLoading?: boolean;
  onResetFilters?: () => void;
}

export const SujetGrid: React.FC<SujetGridProps> = ({
  sujets,
  isLoading = false,
  onResetFilters,
}) => {
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

  if (!sujets.length) {
    return (
      <EmptyState
        title="Aucun sujet trouvé"
        description="Aucune consultation, sondage ou projet ne correspond à vos critères de recherche actuels."
        actionLabel="Réinitialiser les filtres"
        onAction={onResetFilters}
      />
    );
  }

  return (
    <div className="w-full flex flex-col space-y-2">
      {sujets.map((sujet) => (
        <SujetCard key={sujet.id} sujet={sujet} />
      ))}
    </div>
  );
};
