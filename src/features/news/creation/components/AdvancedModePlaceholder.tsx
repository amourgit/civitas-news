// ============================================================
// src/features/news/creation/components/AdvancedModePlaceholder.tsx
// Le mode avancé (canevas libre : frames, textes, images positionnés
// sans contrainte, façon Figma) est le sujet d'une itération séparée.
// Ce panneau annonce honnêtement ce qui arrive plutôt que de simuler
// un éditeur non fonctionnel.
// ============================================================

import React from 'react';
import { Frame } from 'lucide-react';

export const AdvancedModePlaceholder: React.FC<{ onBackToStandard: () => void }> = ({ onBackToStandard }) => (
  <div className="flex flex-col items-center text-center gap-4 py-24 px-6">
    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#5B4DFF]/10">
      <Frame className="w-7 h-7 text-[#5B4DFF]" />
    </div>
    <div className="space-y-1.5 max-w-md">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white font-display">Mode avancé — bientôt disponible</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Un canevas libre pour composer votre publication comme dans un outil de design : frames, blocs de texte et
        images positionnés librement, sans contrainte de gabarit. En attendant, le mode standard couvre déjà
        l'ensemble des champs de publication.
      </p>
    </div>
    <button
      type="button"
      onClick={onBackToStandard}
      className="mt-2 rounded-full bg-[#5B4DFF] text-white text-sm font-bold px-5 py-2.5 hover:bg-[#4739E0] transition-colors"
    >
      Revenir au mode standard
    </button>
  </div>
);
