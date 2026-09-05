import React from 'react';
import './ReelsDirectsLoop.css';

/**
 * Cycle d'animation "enregistrement -> montage sur laptop ->
 * publication", qui boucle à l'infini (voir ReelsDirectsLoop.css).
 *
 * Sert d'AFFICHAGE PAR DÉFAUT de la page Reels & Directs tant
 * qu'aucun contenu (front ou back) n'existe encore côté plateforme :
 * ce n'est pas un spinner de chargement, c'est l'illustration fixe
 * de la page en l'absence de contenu.
 *
 * Composant fourni repris à l'identique (mécanisme et timing
 * intacts) ; voir ReelsDirectsLoop.css pour le détail des seules
 * adaptations (scoping des classes, renommage des keyframes,
 * couleur d'accent recalibrée sur la marque CIVITAS).
 */
export function ReelsDirectsLoop() {
  return (
    <div className="reels-directs-loop" aria-hidden="true">
      <div className="ph1">
        <div className="record" />
        <div className="record-text">REC</div>
      </div>
      <div className="ph2">
        <div className="laptop-b" />
        <svg className="laptop-t" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 30">
          <path
            d="M21 1H5C2.78 1 1 2.78 1 5V25a4 4 90 004 4H37a4 4 90 004-4V5c0-2.22-1.8-4-4-4H21"
            pathLength={100}
            strokeWidth={2}
            stroke="currentColor"
            fill="none"
          />
        </svg>
      </div>
      <div className="icon" />
    </div>
  );
}

export default ReelsDirectsLoop;
