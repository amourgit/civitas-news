import { useEffect, useRef, useState, type DependencyList } from 'react';
import { loadingStore } from '../store/loading.store';

export interface UseAsyncResourceState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseAsyncResourceOptions {
  /**
   * Si false, la tâche n'est PAS annoncée à l'overlay global de
   * chargement (loading.store) -- utile pour un rafraîchissement
   * silencieux en arrière-plan qui ne doit pas replonger toute la page
   * dans l'overlay plein écran. true par défaut.
   */
  reportToGlobalOverlay?: boolean;
}

/**
 * Hook générique de chargement de données -- remplace le pattern
 * dupliqué "useState + useEffect + isMounted" présent dans plusieurs
 * hooks de src/features/*\/hooks (useNews.ts, useNewsList.ts,
 * useReferentiels.ts...). Deux garanties que le pattern isMounted seul
 * ne donne pas :
 *
 * 1. Protection anti-course par JETON de requête, pas seulement
 *    anti-fuite mémoire après démontage : si `fetcher`/`deps` change
 *    avant la fin d'un appel précédent (ex: deux slugs demandés
 *    rapidement l'un après l'autre sur le MÊME composant monté), la
 *    réponse tardive de l'ancien appel est ignorée même si le
 *    composant est toujours monté -- exactement le scénario "bavure"
 *    (flash de l'ancien contenu) qu'un simple `isMounted` ne couvre
 *    pas.
 * 2. Chaque exécution s'annonce sur loading.store pendant sa durée,
 *    pour que AppLoadingOverlay (via GlobalLoadingOverlay, voir
 *    App.tsx) reflète aussi les chargements de données de page, pas
 *    seulement l'hydratation de session ou le téléchargement du chunk
 *    de route.
 *
 * Limite connue, à traiter dans une passe séparée si besoin : la
 * couche HTTP (GetService/BaseHttpService) ne prend pas encore
 * d'AbortSignal externe -- la requête réseau sous-jacente d'un appel
 * devenu obsolète continue donc en arrière-plan même quand sa réponse
 * est ignorée ici (aucune incidence sur l'affichage, juste de la bande
 * passante non annulée).
 *
 * `fetcher` à `null` désactive le hook (ex: paramètre de route pas
 * encore disponible) : isLoading passe immédiatement à false plutôt
 * que de rester bloqué à true indéfiniment.
 */
export function useAsyncResource<T>(
  fetcher: (() => Promise<T>) | null,
  deps: DependencyList,
  options: UseAsyncResourceOptions = {}
): UseAsyncResourceState<T> {
  const { reportToGlobalOverlay = true } = options;
  const [state, setState] = useState<UseAsyncResourceState<T>>({
    data: null,
    isLoading: fetcher !== null,
    error: null,
  });
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!fetcher) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    const requestId = ++requestIdRef.current;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const endTask = reportToGlobalOverlay ? loadingStore.beginLoadingTask() : null;

    fetcher()
      .then((data) => {
        if (requestIdRef.current !== requestId) return; // réponse obsolète, un appel plus récent a pris le relais
        setState({ data, isLoading: false, error: null });
      })
      .catch((err) => {
        if (requestIdRef.current !== requestId) return;
        setState({
          data: null,
          isLoading: false,
          error: err?.message || 'Erreur lors du chargement',
        });
      })
      .finally(() => {
        endTask?.();
      });
    // deps est fourni par l'appelant (contrat volontairement identique à useEffect) --
    // fetcher n'a pas à y figurer séparément, il est recréé avec les mêmes deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
