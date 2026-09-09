import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';
import { loadingStore } from '../store/loading.store';
import { ApiError } from '../services/api/errors/ApiError';
import { NetworkError } from '../services/api/errors/NetworkError';

export interface UseAsyncResourceState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseAsyncResourceRetryConfig {
  /** Nombre de tentatives SUPPLÉMENTAIRES après l'échec initial (0 = aucune). */
  attempts?: number;
  /** Délai de base en millisecondes entre deux tentatives. */
  delay?: number;
  /** Si vrai (défaut), le délai double à chaque tentative (1x, 2x, 4x...). */
  exponentialBackoff?: boolean;
}

export interface UseAsyncResourceOptions {
  /**
   * Si false, la tâche n'est PAS annoncée à l'overlay global de
   * chargement (loading.store) -- utile pour un rafraîchissement
   * silencieux en arrière-plan qui ne doit pas replonger toute la page
   * dans l'overlay plein écran. true par défaut.
   */
  reportToGlobalOverlay?: boolean;
  /**
   * Nouvelles tentatives automatiques après un échec jugé TRANSITOIRE
   * (NetworkError, timeout, ApiError 5xx/408/429) -- jamais sur une
   * erreur définitive (ex: 4xx de validation), qui échouerait de façon
   * identique à chaque tentative. `true` = réglages par défaut
   * (2 tentatives, 1s, backoff exponentiel) ; un objet permet de les
   * personnaliser ; `false`/omis = comportement historique (aucune
   * tentative automatique).
   *
   * Dans tous les cas, `refetch()` (voir valeur de retour) reste
   * disponible : avant ce correctif, un échec -- même transitoire --
   * bloquait le hook jusqu'au prochain changement de `deps` ou un
   * rechargement complet de la page, sans aucun moyen de reprendre la
   * main depuis l'UI.
   */
  retry?: UseAsyncResourceRetryConfig | boolean;
}

export interface UseAsyncResourceResult<T> extends UseAsyncResourceState<T> {
  /** Relance manuellement le chargement, sans attendre un changement de `deps`. */
  refetch: () => void;
}

const DEFAULT_RETRY_ATTEMPTS = 2;
const DEFAULT_RETRY_DELAY_MS = 1000;

function isRetryableError(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  if (error instanceof ApiError) {
    // status 0 = pas de réponse réseau (voir ApiError.ts) ; 408/429/5xx
    // sont des échecs typiquement transitoires côté serveur/réseau.
    return error.status === 0 || error.status >= 500 || error.status === 408 || error.status === 429;
  }
  // Erreur d'une classe non reconnue (ni ApiError ni NetworkError) : on
  // préfère retenter plutôt que d'abandonner sur une classe qu'on ne
  // sait pas qualifier de définitive.
  return true;
}

function resolveRetryConfig(retry: UseAsyncResourceRetryConfig | boolean | undefined): Required<UseAsyncResourceRetryConfig> | null {
  if (!retry) return null;
  const config = retry === true ? {} : retry;
  return {
    attempts: config.attempts ?? DEFAULT_RETRY_ATTEMPTS,
    delay: config.delay ?? DEFAULT_RETRY_DELAY_MS,
    exponentialBackoff: config.exponentialBackoff ?? true,
  };
}

/**
 * Hook générique de chargement de données -- remplace le pattern
 * dupliqué "useState + useEffect + isMounted" présent dans plusieurs
 * hooks de src/features/*\/hooks (useNews.ts, useNewsList.ts,
 * useReferentiels.ts...). Garanties données par ce hook :
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
 * 3. Optionnellement, des tentatives automatiques avec backoff sur les
 *    échecs transitoires (voir `retry`), et dans tous les cas un
 *    `refetch()` manuel toujours disponible -- plus jamais bloqué en
 *    échec permanent tant que la page n'est pas rechargée.
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
): UseAsyncResourceResult<T> {
  const { reportToGlobalOverlay = true, retry } = options;
  const retryConfig = resolveRetryConfig(retry);

  const [state, setState] = useState<UseAsyncResourceState<T>>({
    data: null,
    isLoading: fetcher !== null,
    error: null,
  });
  const requestIdRef = useRef(0);
  const [manualRetryToken, setManualRetryToken] = useState(0);

  useEffect(() => {
    if (!fetcher) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    const requestId = ++requestIdRef.current;
    let cancelled = false;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    const endTask = reportToGlobalOverlay ? loadingStore.beginLoadingTask() : null;

    const attempt = async (attemptIndex: number): Promise<void> => {
      try {
        const data = await fetcher();
        if (requestIdRef.current !== requestId || cancelled) return;
        setState({ data, isLoading: false, error: null });
      } catch (err) {
        if (requestIdRef.current !== requestId || cancelled) return;

        const canRetry = retryConfig !== null && attemptIndex < retryConfig.attempts && isRetryableError(err);
        if (canRetry) {
          const waitMs = retryConfig.exponentialBackoff
            ? retryConfig.delay * Math.pow(2, attemptIndex)
            : retryConfig.delay;
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          if (requestIdRef.current !== requestId || cancelled) return;
          return attempt(attemptIndex + 1);
        }

        setState({
          data: null,
          isLoading: false,
          error: (err as { message?: string } | undefined)?.message || 'Erreur lors du chargement',
        });
      }
    };

    void attempt(0).finally(() => endTask?.());

    return () => {
      cancelled = true;
      // Termine immédiatement la tâche annoncée à l'overlay global si le
      // composant démonte ou change de deps EN PLEIN backoff -- sinon
      // l'overlay resterait actif jusqu'à la fin des tentatives restantes
      // (idempotent, voir loading.store.ts : le .finally ci-dessus peut
      // encore l'appeler sans risque une fois la chaîne réellement finie).
      endTask?.();
    };
    // deps est fourni par l'appelant (contrat volontairement identique à useEffect) --
    // fetcher n'a pas à y figurer séparément, il est recréé avec les mêmes deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, manualRetryToken]);

  const refetch = useCallback(() => setManualRetryToken((n) => n + 1), []);

  return { ...state, refetch };
}
