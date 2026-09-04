import React, { useMemo } from 'react';
import { Newspaper, Clock3 } from 'lucide-react';
import { News } from '../../../../types/global.types';
import { ShareWidget } from './sidebar/ShareWidget';
import { InfoStatsWidget } from './sidebar/InfoStatsWidget';
import { CategoryTagsWidget } from './sidebar/CategoryTagsWidget';
import { ArticleListWidget } from './sidebar/ArticleListWidget';
import { CommentsPreviewWidget } from './sidebar/CommentsPreviewWidget';

export interface NewsDetailSidebarProps {
  news: News;
  allNews: News[];
  onUpdate?: (updated: News) => void;
  onScrollToComments?: () => void;
}

const RELATED_LIMIT = 3;
const RECENT_LIMIT = 4;

/**
 * Colonne latérale (widgets), volontairement indépendante et séparée
 * du contenu de l'article -- propre à cette page (le mécanisme global
 * SideContent reste désactivé partout ailleurs, voir
 * components/layout/SideContent.tsx). Composé de blocs modulaires
 * pouvant être réordonnés/retirés indépendamment.
 *
 * Scroll indépendant, SANS `position: sticky` : la sidebar a sa propre
 * hauteur bornée (`h-[calc(100vh-7rem)]`, identique à celle du `<main>`
 * dans NewsDetailPage) et son propre `overflow-y-auto` -- si son
 * contenu dépasse cette hauteur, elle défile sur elle-même, sans jamais
 * faire défiler la page ni être affectée par le scroll de l'article.
 * `sticky` a été volontairement écarté : un élément sticky reste
 * couplé, par construction, à la hauteur de son bloc englobant (ici la
 * colonne `<main>`, presque toujours plus haute) et "décroche"
 * brutalement de son point d'ancrage dès que ce bloc se termine -- ce
 * qui produisait un à-coup visible juste avant la fin du défilement de
 * l'article. Deux panneaux à hauteur fixe et scroll propre, plutôt
 * qu'un panneau sticky dépendant de la hauteur de l'autre, garantit une
 * indépendance totale entre les deux défilements, dans les deux sens.
 * `overscroll-contain` empêche en plus le "scroll chaining" vers la
 * page une fois le haut/bas de ce scroll interne atteint. La
 * scrollbar de ce panneau est masquée via `.no-scrollbar` (voir
 * src/index.css) : le contenu reste scrollable, seul son rendu visuel
 * disparaît.
 */
export const NewsDetailSidebar: React.FC<NewsDetailSidebarProps> = ({
  news,
  allNews,
  onUpdate,
  onScrollToComments,
}) => {
  const { related, recent } = useMemo(() => {
    const others = allNews.filter((n) => n.id !== news.id);
    const sameCategory = others.filter((n) => n.categorie?.id === news.categorie?.id);
    const rest = others.filter((n) => n.categorie?.id !== news.categorie?.id);
    const related = [...sameCategory, ...rest].slice(0, RELATED_LIMIT);

    const relatedIds = new Set(related.map((n) => n.id));
    const recent = [...others]
      .filter((n) => !relatedIds.has(n.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, RECENT_LIMIT);

    return { related, recent };
  }, [allNews, news.id, news.categorie?.id]);

  return (
    <aside
      className="w-full lg:h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1 lg:pb-2 space-y-5 no-scrollbar"
    >
      <ShareWidget news={news} onUpdate={onUpdate} />
      <InfoStatsWidget news={news} />
      <CategoryTagsWidget news={news} />
      <ArticleListWidget title="Articles similaires" icon={<Newspaper className="w-4 h-4" />} items={related} />
      <ArticleListWidget title="À lire aussi" icon={<Clock3 className="w-4 h-4" />} items={recent} />
      <CommentsPreviewWidget newsId={news.id} onScrollToComments={onScrollToComments} />
    </aside>
  );
};
