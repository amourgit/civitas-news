import React from 'react';
import { Video } from 'lucide-react';

// Aucune fonctionnalité "Reels & Directs" (front ou back) n'existe
// encore dans la plateforme — voir le message livré à l'utilisateur.
// Cette page évite un onglet de dock qui ne mènerait nulle part, en
// attendant que la fonctionnalité soit spécifiée et construite.
export default function ReelsDirectsPage() {
  return (
    <div className="max-w-lg mx-auto pb-16 pt-10 flex flex-col items-center text-center gap-4">
      <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/40 text-[#5B4DFF] flex items-center justify-center">
        <Video className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-extrabold text-gray-900 dark:text-white font-display">Reels & Directs</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Les vidéos courtes et les diffusions en direct arrivent bientôt sur CIVITAS.
      </p>
    </div>
  );
}
