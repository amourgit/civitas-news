import React from 'react';
import { News } from '../../../../../types/global.types';
import { SidebarWidgetCard } from './SidebarWidgetCard';
import { ArticleMiniCard } from './ArticleMiniCard';

export interface ArticleListWidgetProps {
  title: string;
  icon?: React.ReactNode;
  items: News[];
}

/**
 * Widget générique listant des articles (miniature + titre) --
 * factorise l'affichage commun aux widgets "Articles similaires" et
 * "Articles récents" (voir RelatedArticlesWidget / RecentArticlesWidget),
 * fidèle à l'esprit "Related post" / "Related Articles" des maquettes.
 */
export const ArticleListWidget: React.FC<ArticleListWidgetProps> = ({ title, icon, items }) => {
  if (!items.length) return null;

  return (
    <SidebarWidgetCard title={title} icon={icon}>
      <div className="space-y-4">
        {items.map((item) => (
          <ArticleMiniCard key={item.id} news={item} />
        ))}
      </div>
    </SidebarWidgetCard>
  );
};
