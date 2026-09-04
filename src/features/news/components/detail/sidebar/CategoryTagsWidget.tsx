import React from 'react';
import { Link } from 'react-router-dom';
import { Tags } from 'lucide-react';
import { News } from '../../../../../types/global.types';
import { SidebarWidgetCard } from './SidebarWidgetCard';

export interface CategoryTagsWidgetProps {
  news: News;
}

/**
 * Widget "Catégorie & mots-clés" -- pastille colorée dynamique
 * (news.categorie.couleur, déjà en base) + nuage de tags. La
 * catégorie renvoie vers la liste filtrée (/news?type=...), chaque
 * tag renvoie vers la recherche existante (/recherche?q=...) -- pas
 * de nouveau système de filtrage par tag inventé, uniquement une
 * réutilisation des routes déjà fonctionnelles.
 */
export const CategoryTagsWidget: React.FC<CategoryTagsWidgetProps> = ({ news }) => {
  if (!news.tags?.length && !news.categorie) return null;

  return (
    <SidebarWidgetCard title="Catégorie & mots-clés" icon={<Tags className="w-4 h-4" />}>
      <Link
        to={`/news?type=${news.type}`}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 border transition-transform hover:scale-[1.03]"
        style={{
          color: news.categorie.couleur,
          borderColor: `${news.categorie.couleur}40`,
          backgroundColor: `${news.categorie.couleur}14`,
        }}
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: news.categorie.couleur }} />
        {news.categorie.nom}
      </Link>

      {news.tags && news.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {news.tags.map((tag) => (
            <Link
              key={tag}
              to={`/recherche?q=${encodeURIComponent(tag)}`}
              className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-[#5B4DFF] hover:text-white transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}
    </SidebarWidgetCard>
  );
};
