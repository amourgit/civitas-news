import { useEffect, useState } from 'react';
import type { News } from '../../../types/global.types';
import { newsService } from '../../../services/news.service';

/**
 * Charge la liste complète des News via `newsService` (qui bascule
 * automatiquement mock/réel selon `env.useMockData`). Remplace les
 * anciens accès directs à `INITIAL_NEWS` dans les widgets de
 * statistiques — ceux-ci doivent consommer le service, pas les
 * données mock brutes.
 */
export function useNewsList(): { news: News[]; isLoading: boolean } {
  const [news, setNews] = useState<News[]>(() => newsService.getNewsSync());
  const [isLoading, setIsLoading] = useState<boolean>(news.length === 0);

  useEffect(() => {
    let cancelled = false;
    newsService
      .getNews()
      .then((data) => {
        if (!cancelled) setNews(data);
      })
      .catch((error) => console.error('Échec du chargement des news:', error))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { news, isLoading };
}
