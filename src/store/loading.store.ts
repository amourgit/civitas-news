import { useEffect, useState } from 'react';

// ============================================================
// src/store/loading.store.ts
// Compteur de tâches de chargement partagé dans toute l'app -- même
// pattern "store maison" que auth.store.ts/ui.store.ts (état de module
// + Set de listeners notifiés via useState+useEffect), pour pouvoir
// déclencher/lever l'overlay global (voir components/ui/
// AppLoadingOverlay.tsx et GlobalLoadingOverlay.tsx) depuis n'importe
// où : un hook de données (hooks/useAsyncResource.ts), une transition
// de route (components/utils/RouteTransitionLoader.tsx), l'hydratation
// de session (auth.store.ts) -- pas seulement depuis un composant React
// monté sous un Context.Provider.
//
// Compteur PAR TÂCHE (pas un simple booléen) : plusieurs tâches
// peuvent se chevaucher (ex: hydratation de session + fetch de la page
// courante + transition de route) ; l'overlay ne doit disparaître que
// lorsque LA DERNIÈRE tâche active se termine, jamais dès qu'une seule
// tâche individuelle se termine.
// ============================================================

let activeTasks = 0;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

/**
 * Démarre une tâche de chargement et retourne la fonction qui la clôt.
 * La fonction de clôture est idempotente : l'appeler plusieurs fois
 * (ex: à la fois dans un `finally` et dans le cleanup d'un effet React)
 * ne décrémente le compteur qu'une seule fois.
 */
function beginLoadingTask(): () => void {
  activeTasks += 1;
  notify();

  let done = false;
  return () => {
    if (done) return;
    done = true;
    activeTasks = Math.max(0, activeTasks - 1);
    notify();
  };
}

/** true dès qu'au moins une tâche de chargement est active. */
export function useIsAppLoading(): boolean {
  const [isLoading, setIsLoading] = useState(activeTasks > 0);

  useEffect(() => {
    const handleChange = () => setIsLoading(activeTasks > 0);
    listeners.add(handleChange);
    // Se resynchronise au montage : une tâche a pu démarrer/finir entre
    // le rendu initial (valeur lue au module-load) et cet effet.
    handleChange();
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  return isLoading;
}

export const loadingStore = {
  beginLoadingTask,
};
