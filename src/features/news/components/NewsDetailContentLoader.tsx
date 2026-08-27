import React from 'react';
import { useNews } from '../hooks/useNews';
import { useNewsList } from '../hooks/useNewsList';
import { NewsDetailContent } from './NewsDetailContent';
import { Skeleton } from '../../../components/ui/Skeleton';
import NotFoundPage from '../../../pages/NotFoundPage';
import { useOpenNewsDetail } from '../hooks/useOpenNewsDetail';

export interface NewsDetailContentLoaderProps {
  slug: string;
}

/**
 * Pont entre le BottomSheet GLOBAL (store/bottomSheet.store.ts, utilisé
 * par les composants qui n'ont pas leur propre état local de sélection
 * -- carrousel d'accueil, widgets de stats, page de focus sondage...)
 * et NewsDetailContent, qui attend un `newsItem` déjà résolu (voir
 * NewsListPage.tsx/HomePage.tsx/RecherchePage.tsx, qui font cette
 * résolution elles-mêmes via leur propre useState + useNews). Ce
 * composant fait juste ce travail de résolution à la place de
 * l'appelant, pour qu'ouvrir les détails depuis n'importe où reste un
 * simple `openNewsDetail(slug)`.
 */
export function NewsDetailContentLoader({ slug }: NewsDetailContentLoaderProps) {
  const { newsItem, setNewsItem, sujet, setSujet, isLoading, error } = useNews(slug);
  const currentItem = newsItem || sujet;
  const { newsList: allNews, sujets: allSujets } = useNewsList();
  const openNewsDetail = useOpenNewsDetail();

  if (isLoading) {
    return (
      <div className="space-y-3 max-w-5xl mx-auto py-2 px-1">
        <Skeleton height={220} variant="card" />
        <Skeleton height={40} variant="rectangular" />
        <Skeleton height={150} variant="rectangular" />
      </div>
    );
  }

  if (error || !currentItem) {
    return <NotFoundPage />;
  }

  return (
    <NewsDetailContent
      newsItem={currentItem}
      onUpdate={setNewsItem || setSujet}
      allNews={allNews}
      allSujets={allSujets}
      onOpenDetail={openNewsDetail}
    />
  );
}
