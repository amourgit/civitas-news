import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { loadingStore } from '../../store/loading.store';

/**
 * Déclenche systématiquement l'overlay de chargement (voir
 * GlobalLoadingOverlay.tsx, monté dans App.tsx) à chaque changement de
 * route -- pas seulement pendant le téléchargement du chunk d'une page
 * (Suspense) ou une requête de données (useAsyncResource) : CHAQUE
 * navigation d'une page à une autre déclenche ce court chargement, y
 * compris vers une route déjà visitée/en cache, pour que l'affichage
 * ait toujours le temps de "s'hydrater" proprement avant que la
 * nouvelle page n'apparaisse -- exactement le comportement demandé.
 *
 * La durée minimale réellement visible et le fondu de sortie sont
 * gérés par AppLoadingOverlay (MIN_VISIBLE_MS) ; ce hook se contente
 * d'ouvrir la tâche puis de la refermer dès que le nouveau contenu a
 * eu le temps de se peindre (double requestAnimationFrame), sans quoi
 * elle se terminerait avant même que le nouveau DOM ne soit posé. Si
 * la nouvelle page démarre elle-même une tâche plus longue (via
 * useAsyncResource), les deux tâches se cumulent naturellement dans le
 * même compteur (loading.store) et l'overlay reste affiché jusqu'à la
 * fin de la plus longue des deux.
 */
export function RouteTransitionLoader(): null {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const endTask = loadingStore.beginLoadingTask();
    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        endTask();
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      endTask();
    };
  }, [pathname]);

  return null;
}

export default RouteTransitionLoader;
