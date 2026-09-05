import React, { useEffect, useState } from 'react';
import { LoadingBottle } from './LoadingBottle';

export interface AppLoadingOverlayProps {
  /** Piloté par l'appelant : fallback statique de <Suspense>, ou booléen réactif de GlobalLoadingOverlay/loading.store. */
  visible: boolean;
  /** Texte annoncé aux lecteurs d'écran pendant le chargement. */
  label?: string;
}

/** Toujours affiché au moins ce délai, même si la tâche sous-jacente est instantanée -- évite un flash illisible et laisse l'animation "le temps de jouer", comme demandé. */
const MIN_VISIBLE_MS = 500;
/** Doit correspondre à la durée de transition `.civitas-loading-overlay` dans index.css. */
const FADE_MS = 200;

/**
 * Overlay plein écran affiché à deux endroits distincts (voir App.tsx) :
 *  1. Comme fallback de <Suspense> pendant le téléchargement du chunk
 *     JS d'une page (React.lazy) -- ici `visible` ne fait que basculer
 *     de true à démonté (Suspense remplace l'arbre, il ne repasse pas
 *     par `visible=false`), donc la disparition est instantanée : c'est
 *     le comportement standard d'un fallback Suspense.
 *  2. Piloté en continu par loading.store via GlobalLoadingOverlay --
 *     là, `visible` transite bien true -> false sur un composant qui
 *     reste monté, et bénéficie alors pleinement de la durée minimale
 *     et du fondu de sortie ci-dessous.
 */
export const AppLoadingOverlay: React.FC<AppLoadingOverlayProps> = ({
  visible,
  label = 'Chargement en cours…',
}) => {
  const [mounted, setMounted] = useState(visible);
  const [shownAt, setShownAt] = useState<number | null>(visible ? Date.now() : null);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setFadingOut(false);
      setShownAt((prev) => prev ?? Date.now());
      return;
    }

    if (!mounted) return;

    const elapsed = shownAt ? Date.now() - shownAt : MIN_VISIBLE_MS;
    const remaining = Math.max(MIN_VISIBLE_MS - elapsed, 0);

    const startFadeTimer = window.setTimeout(() => setFadingOut(true), remaining);
    const unmountTimer = window.setTimeout(() => {
      setMounted(false);
      setShownAt(null);
      setFadingOut(false);
    }, remaining + FADE_MS);

    return () => {
      window.clearTimeout(startFadeTimer);
      window.clearTimeout(unmountTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={`fixed inset-0 z-[999] flex items-center justify-center backdrop-blur-sm civitas-loading-overlay ${
        fadingOut ? 'civitas-loading-overlay--hidden' : ''
      }`}
    >
      <LoadingBottle />
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default AppLoadingOverlay;
