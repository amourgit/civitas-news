import React from 'react';
import { useParams } from 'react-router-dom';
import { useNews } from '../features/news/hooks/useNews';
import { useNewsList } from '../features/news/hooks/useNewsList';
import { NewsDetailContent } from '../features/news/components/NewsDetailContent';
import { Skeleton } from '../components/ui/Skeleton';
import NotFoundPage from './NotFoundPage';

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { newsItem, setNewsItem, sujet, setSujet, isLoading, error } = useNews(slug);
  const currentItem = newsItem || sujet;
  const { newsList, sujets: allSujets } = useNewsList();

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
      allNews={newsList || allSujets}
      allSujets={newsList || allSujets}
    />
  );
}


