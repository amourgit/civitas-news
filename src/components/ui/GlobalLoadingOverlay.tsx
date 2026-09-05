import React from 'react';
import { useIsAppLoading } from '../../store/loading.store';
import { AppLoadingOverlay } from './AppLoadingOverlay';

/**
 * Pont entre loading.store (compteur de tâches : hydratation de
 * session -- voir auth.store.ts --, requêtes de page via
 * useAsyncResource, transitions de route via RouteTransitionLoader) et
 * l'overlay visuel. Monté une seule fois à la racine (voir App.tsx),
 * en dehors du <Suspense> qui entoure <Routes> : contrairement à son
 * fallback, qui ne couvre que le téléchargement du chunk JS d'une
 * page, celui-ci reste monté en continu et bénéficie donc pleinement
 * de la durée minimale d'affichage et du fondu de sortie
 * d'AppLoadingOverlay.
 */
export function GlobalLoadingOverlay() {
  const isLoading = useIsAppLoading();
  return <AppLoadingOverlay visible={isLoading} />;
}

export default GlobalLoadingOverlay;
