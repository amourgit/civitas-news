import React from 'react';
import { News, Sujet } from '../../../types/global.types';
import { NewsCard } from './NewsCard';

export interface NewsSimilairesProps {
  currentNewsId?: string;
  currentSujetId?: string;
  allNews?: News[];
  allSujets?: News[];
  onOpenDetail?: (slug: string) => void;
}

export const NewsSimilaires: React.FC<NewsSimilairesProps> = ({
  currentNewsId,
  currentSujetId,
  allNews,
  allSujets,
  onOpenDetail,
}) => {
  const currentId = currentNewsId || currentSujetId;
  const list = allNews || allSujets || [];
  const similar = list.filter((s) => s.id !== currentId).slice(0, 3);

  if (!similar.length) return null;

  return (
    <div className="w-full mt-4 pt-3 border-t border-gray-200 dark:border-gray-800">
      <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white font-display mb-2">
        News & Publications Similaires
      </h3>
      <div className="w-full flex flex-col space-y-2">
        {similar.map((s) => (
          <NewsCard key={s.id} news={s} onOpenDetail={onOpenDetail} />
        ))}
      </div>
    </div>
  );
};

export const SujetsSimilaires = NewsSimilaires;
export type SujetsSimilairesProps = NewsSimilairesProps;

