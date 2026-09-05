import { useEffect, useState } from 'react';
import { News } from '../../../types/global.types';
import { newsService } from '../../../services/api/news.service';
import { useAsyncResource } from '../../../hooks/useAsyncResource';

/**
 * Migré vers useAsyncResource (voir hooks/useAsyncResource.ts) : même
 * contrat public qu'avant (mêmes clés retournées, même comportement
 * observable pour les appelants -- NewsDetailPage.tsx,
 * NewsDetailContentLoader.tsx, SondageFocusPage.tsx, RecherchePage.tsx,
 * HomePage.tsx, NewsListPage.tsx), mais avec la garde anti-course par
 * jeton de requête (une réponse tardive d'un ancien slug ne peut plus
 * écraser le résultat d'un slug plus récent, même sans démontage du
 * composant) et l'annonce de la tâche à l'overlay global de chargement
 * (loading.store, voir App.tsx). `setNews` reste nécessaire : plusieurs
 * appelants mettent à jour l'article localement après une action
 * (réaction, vote...) sans reload complet -- voir NewsDetailPage.tsx.
 *
 * Seul changement de comportement volontaire : si `slug` est absent,
 * `isLoading` passe à false immédiatement au lieu de rester bloqué à
 * true indéfiniment (l'ancienne implémentation initialisait `isLoading`
 * à true puis sortait de l'effet sans jamais le repasser à false tant
 * qu'aucun slug n'était fourni).
 */
export function useNews(slug?: string) {
  const { data, isLoading, error } = useAsyncResource<News | null>(
    slug ? () => newsService.getNewsBySlug(slug) : null,
    [slug]
  );

  const [news, setNews] = useState<News | null>(data ?? null);
  useEffect(() => {
    setNews(data ?? null);
  }, [data]);

  const notFoundError = !isLoading && slug && data === null ? 'News introuvable' : null;

  return {
    news,
    setNews,
    newsItem: news,
    setNewsItem: setNews,
    sujet: news,
    setSujet: setNews,
    isLoading,
    error: error ?? notFoundError,
  };
}

export const useSujet = useNews;
