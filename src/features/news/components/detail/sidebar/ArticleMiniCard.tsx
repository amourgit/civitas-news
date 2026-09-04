import React from 'react';
import { Link } from 'react-router-dom';
import { News } from '../../../../../types/global.types';

export interface ArticleMiniCardProps {
  news: News;
}

/**
 * Vignette compacte (miniature + titre + catégorie/date) pour les
 * listes "Articles similaires" / "Articles récents" de la sidebar --
 * inspirée des blocs "Related post"/"Related Articles" des maquettes
 * de référence. Navigue vers la vraie page détail (/news/:slug),
 * contrairement au BottomSheet qui utilise un état local.
 */
export const ArticleMiniCard: React.FC<ArticleMiniCardProps> = ({ news }) => {
  return (
    <Link to={`/news/${news.slug}`} className="flex items-start gap-3 group">
      <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800">
        <img
          src={news.image}
          alt={news.titre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="min-w-0 py-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: news.categorie.couleur }}>
          {news.categorie.nom}
        </span>
        <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-[#5B4DFF] dark:group-hover:text-sky-300 transition-colors">
          {news.titre}
        </h4>
        <span className="text-[11px] text-gray-400">
          {new Date(news.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>
    </Link>
  );
};
