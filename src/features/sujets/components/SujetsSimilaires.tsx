import React from 'react';
import { Sujet } from '../../../types/global.types';
import { SujetCard } from './SujetCard';

export interface SujetsSimilairesProps {
  currentSujetId: string;
  allSujets: Sujet[];
}

export const SujetsSimilaires: React.FC<SujetsSimilairesProps> = ({ currentSujetId, allSujets }) => {
  const similar = allSujets.filter((s) => s.id !== currentSujetId).slice(0, 3);

  if (!similar.length) return null;

  return (
    <div className="w-full mt-4 pt-3 border-t border-gray-200 dark:border-gray-800">
      <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white font-display mb-2">
        Sujets & Consultations Similaires
      </h3>
      <div className="w-full flex flex-col space-y-2">
        {similar.map((s) => (
          <SujetCard key={s.id} sujet={s} />
        ))}
      </div>
    </div>
  );
};
