import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { News } from '../../../../types/global.types';

export interface NewsDetailBreadcrumbProps {
  news: News;
}

/**
 * Fil d'ariane discret en tête de page -- Accueil / News / Catégorie,
 * dernier maillon (titre courant) non cliquable et tronqué. Reprend
 * simplement les routes déjà existantes (/, /news), sans logique
 * nouvelle.
 */
export const NewsDetailBreadcrumb: React.FC<NewsDetailBreadcrumbProps> = ({ news }) => {
  return (
    <nav
      aria-label="Fil d'ariane"
      className="flex items-center gap-1.5 text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 overflow-x-auto no-scrollbar"
    >
      <Link to="/" className="hover:text-[#5B4DFF] dark:hover:text-sky-300 transition-colors whitespace-nowrap">
        Accueil
      </Link>
      <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
      <Link to="/news" className="hover:text-[#5B4DFF] dark:hover:text-sky-300 transition-colors whitespace-nowrap">
        News
      </Link>
      <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
      <Link
        to={`/news?type=${news.type}`}
        className="hover:text-[#5B4DFF] dark:hover:text-sky-300 transition-colors whitespace-nowrap"
      >
        {news.categorie.nom}
      </Link>
      <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
      <span className="truncate max-w-[40vw] sm:max-w-xs text-gray-400 dark:text-gray-500">{news.titre}</span>
    </nav>
  );
};
