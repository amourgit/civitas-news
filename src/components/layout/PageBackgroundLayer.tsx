import React from 'react';
import { usePageBackgroundContext } from '../../context/PageBackgroundContext';
import { DefaultBackground } from './DefaultBackground';

/**
 * Couche visuelle unique de l'arrière-plan de page : fixe, plein
 * viewport (fixed inset-0), toujours DERRIÈRE tout le reste (topbar,
 * contenu, dock mobile) grâce à un z-index négatif — z-index négatif
 * qui ne fonctionne que parce qu'aucun ancêtre entre elle et la racine
 * n'a son propre fond opaque (voir App.tsx : le conteneur racine n'a
 * plus de bg-* dans son className, précisément pour laisser transparaître
 * cette couche).
 *
 * Affiche <DefaultBackground /> tant qu'aucune page n'a appelé
 * usePageBackground, sinon le composant React fourni par la page
 * actuellement affichée — remplacé automatiquement à chaque changement
 * de page.
 *
 * À monter UNE SEULE FOIS, tout en haut de l'app (voir App.tsx), à
 * l'intérieur de PageBackgroundProvider.
 */
export const PageBackgroundLayer: React.FC = () => {
  const { background } = usePageBackgroundContext();

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {background ?? <DefaultBackground />}
    </div>
  );
};
