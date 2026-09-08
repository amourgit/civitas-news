// ============================================================
// src/features/news/creation/components/ModeToggle.tsx
// Contenu du niveau 1 de la topbar (voir useSetTopbarContent('upper',
// ...)) : la pilule d'accueil (bg-[#3B3DD9], voir notch-nav.tsx) est
// déjà fournie par la topbar elle-même -- ce composant ne rend que le
// contenu interne, un commutateur à deux positions.
// ============================================================

import React from 'react';
import type { CreationMode } from '../types';

export const ModeToggle: React.FC<{ mode: CreationMode; onChange: (mode: CreationMode) => void }> = ({ mode, onChange }) => (
  <div className="flex items-center gap-0.5 text-xs font-bold text-white/70">
    <button
      type="button"
      onClick={() => onChange('standard')}
      className={`rounded-full px-3 py-1.5 transition-colors ${mode === 'standard' ? 'bg-white/25 text-white' : 'hover:text-white'}`}
    >
      Standard
    </button>
    <button
      type="button"
      onClick={() => onChange('avance')}
      className={`rounded-full px-3 py-1.5 transition-colors ${mode === 'avance' ? 'bg-white/25 text-white' : 'hover:text-white'}`}
    >
      Avancé
    </button>
  </div>
);
