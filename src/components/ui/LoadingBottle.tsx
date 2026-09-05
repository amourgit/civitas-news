import React from 'react';

export interface LoadingBottleProps {
  /** Classes additionnelles -- permet de resurcharger la taille (par défaut w-[45px]) ou la couleur. */
  className?: string;
}

/**
 * Loader de marque CIVITAS -- silhouette de bouteille dont le tracé se
 * dessine en boucle (voir @keyframes civitas-loading-bottle-draw dans
 * index.css). Purement décoratif : `aria-hidden`, le texte accessible
 * est porté par le conteneur appelant (voir AppLoadingOverlay.tsx) via
 * `role="status"` + `aria-label`, pour ne pas dupliquer l'annonce
 * quand plusieurs instances sont montées en même temps (overlay global
 * + fallback de Suspense, par exemple).
 *
 * Adapté depuis un snippet Next.js utilisant `<style jsx>` (styled-jsx,
 * absent de cette stack Vite) : le tracé et le rythme d'origine sont
 * conservés à l'identique, seule l'implémentation CSS change (classe
 * globale dans index.css au lieu d'un style scoppé par composant) et
 * le trait passe au `currentColor` pour suivre la couleur de texte
 * ambiante (thème clair/sombre) plutôt qu'un noir fixe.
 */
export const LoadingBottle: React.FC<LoadingBottleProps> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 205 615"
      aria-hidden="true"
      focusable="false"
      className={`w-[45px] fill-transparent stroke-current text-[var(--civitas-purple)] dark:text-[var(--civitas-purple-accent)] [stroke-width:15px] [stroke-linecap:round] [stroke-linejoin:round] ${className}`}
    >
      <path
        className="civitas-loading-bottle__path"
        d="M47 595c-8 0-26-6-26-34V261c0-17 9-29 16-38s16-28 16-28L68 59l-4-5s3-30 7-36 14-6 32-6 28 0 32 6 7 36 7 36l-4 5 15 136s9 19 16 28 16 21 16 38v300c0 28-18 34-26 34H47z"
      />
    </svg>
  );
};

export default LoadingBottle;
