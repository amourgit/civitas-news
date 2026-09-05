import React from 'react';
import { ReelsDirectsLoop } from '../components/reels/ReelsDirectsLoop';

// Aucune fonctionnalité "Reels & Directs" (front ou back) n'existe
// encore dans la plateforme. Cette page évite un onglet de dock qui
// ne mènerait nulle part, en attendant que la fonctionnalité soit
// spécifiée et construite.
//
// L'animation ci-dessous (cycle enregistrement -> montage ->
// publication, en boucle infinie) sert d'affichage PAR DÉFAUT de la
// page — ce n'est pas un spinner de chargement.
export default function ReelsDirectsPage() {
  return (
    <div className="max-w-lg mx-auto pb-16 pt-10 flex flex-col items-center text-center gap-4">
      <ReelsDirectsLoop />
      <h1 className="text-xl font-extrabold text-gray-900 dark:text-white font-display">Reels & Directs</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Les vidéos courtes et les diffusions en direct arrivent bientôt sur CIVITAS.
      </p>
    </div>
  );
}
