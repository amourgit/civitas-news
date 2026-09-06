import React from 'react';
import { Calendar, Clock, MessageCircle } from 'lucide-react';
import { News } from '../../../../types/global.types';
import { Avatar } from '../../../../components/ui/Avatar';
import { estimateReadingTimeMinutes } from '../../../../lib/readingTime';
import { NewsDetailBreadcrumb } from './NewsDetailBreadcrumb';
import { NewsDetailLikeButton } from './NewsDetailLikeButton';

export interface NewsDetailHeroProps {
  news: News;
  onUpdate?: (updated: News) => void;
  onScrollToComments?: () => void;
}

export const NewsDetailHero: React.FC<NewsDetailHeroProps> = ({ news, onUpdate, onScrollToComments }) => {
  const readingTime = estimateReadingTimeMinutes(news.contenu, news.description);
  const publishedOn = new Date(news.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="space-y-4 sm:space-y-5">
      <NewsDetailBreadcrumb news={news} />

      <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black font-display leading-[1.12] tracking-tight text-gray-900 dark:text-white">
        {news.titre}
      </h1>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 pt-4 border-t border-gray-100 dark:border-gray-800/80">
        {/* Auteur */}
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={news.auteur.avatar} name={news.auteur.nomAffiche} size="md" />
          <div className="leading-tight min-w-0">
            <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{news.auteur.nomAffiche}</div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {publishedOn}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {readingTime} min de lecture
              </span>
            </div>
          </div>
        </div>

        {/* Réaction + accès rapide aux commentaires */}
        <div className="flex items-center gap-5 shrink-0">
          <NewsDetailLikeButton news={news} onUpdate={onUpdate} />
          <button
            type="button"
            onClick={onScrollToComments}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-[#5B4DFF] dark:hover:text-sky-300 transition-colors"
            title="Aller aux commentaires"
          >
            <MessageCircle className="w-[18px] h-[18px]" />
            <span>{news.stats.commentaires}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
