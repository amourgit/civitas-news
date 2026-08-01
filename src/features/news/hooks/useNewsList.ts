import { useState, useEffect } from 'react';
import { News, NewsType } from '../../../types/global.types';
import { newsService } from '../../../services/news.service';

export function useNewsList(params?: { category?: string; type?: NewsType; search?: string; province?: string }) {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const data = await newsService.getNews(params);
      setNewsList(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du chargement des news');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [params?.category, params?.type, params?.search, params?.province]);

  return { newsList, sujets: newsList, isLoading, error, refetch: fetchNews };
}

export const useSujets = useNewsList;

