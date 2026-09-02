import { useState, useEffect } from 'react';
import { News } from '../../../types/global.types';
import { newsService } from '../../../services/api/news.service';
import type { NewsQueryParams } from '../../../services/api/repositories/news.repository';

export function useNewsList(params?: NewsQueryParams) {
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
  }, [params?.categorieId, params?.organisationId, params?.etablissementId, params?.type, params?.search, params?.province, params?.auteur]);

  return { newsList, sujets: newsList, isLoading, error, refetch: fetchNews };
}

export const useSujets = useNewsList;

