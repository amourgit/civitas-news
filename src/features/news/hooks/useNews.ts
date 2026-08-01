import { useState, useEffect } from 'react';
import { News, Sujet } from '../../../types/global.types';
import { newsService } from '../../../services/news.service';

export function useNews(slug?: string) {
  const [news, setNews] = useState<News | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    setIsLoading(true);

    newsService
      .getNewsBySlug(slug)
      .then((data) => {
        if (isMounted) {
          setNews(data);
          setError(data ? null : 'News introuvable');
        }
      })
      .catch((err) => {
        if (isMounted) setError(err?.message || 'Erreur lors du chargement');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { news, setNews, newsItem: news, setNewsItem: setNews, sujet: news, setSujet: setNews, isLoading, error };
}

export const useSujet = useNews;

