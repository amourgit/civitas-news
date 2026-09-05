import React from 'react';

/**
 * Arrière-plan PAR DÉFAUT de toutes les pages qui n'appellent pas
 * usePageBackground (voir context/PageBackgroundContext.tsx).
 *
 * Reproduit aujourd'hui exactement le fond uni déjà utilisé par l'app
 * (aucun changement visuel à l'introduction du système) — c'est le point
 * à éditer pour un futur décor par défaut commun à toutes les pages
 * (dégradé, formes, image, vidéo...), sans avoir à toucher au provider
 * ni aux pages qui définissent déjà leur propre fond via
 * usePageBackground.
 */
export const DefaultBackground: React.FC = () => (
  <div className="absolute inset-0 bg-[#F7F8FC] dark:bg-[#0E1338] transition-colors duration-300" />
);
