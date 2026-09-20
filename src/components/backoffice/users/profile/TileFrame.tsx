// ============================================================
// src/components/backoffice/users/profile/TileFrame.tsx
// Le CADRE d'une information de la grille. C'est le même cadre en
// lecture et en édition : seul son contenu (valeur -> champ) et son état
// visuel changent, de sorte que la fiche ne « saute » pas au moment de
// passer en édition.
//
// L'état visuel porte de l'information (jamais de la décoration) :
//   view      lecture -- apparence historique de la fiche ;
//   editable  champ modifiable -- contour de marque, anneau au focus ;
//   locked    modifiable en principe, mais pas par vous (cadre grisé + cadenas) ;
//   system    donnée gérée par le système -- atténuée en édition ;
//   secret    mot de passe -- TOUJOURS grisé, contour en pointillés.
// Par-dessus : un point de marque = « modifié, non enregistré » ; un
// contour rouge = erreur.
// ============================================================

import React from 'react';
import { Lock } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { TileIcon } from './userProfile.schema';

export type TileTone = 'view' | 'editable' | 'locked' | 'system' | 'secret';

const TONE_FRAME: Record<TileTone, string> = {
  view: 'border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1A1F4D]',
  editable:
    'border-[#5B4DFF]/25 dark:border-[#7B61FF]/35 bg-white dark:bg-[#1A1F4D] '
    + 'focus-within:border-[#5B4DFF] focus-within:ring-2 focus-within:ring-[#5B4DFF]/20',
  locked: 'border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-white/[0.03]',
  system: 'border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-[#1A1F4D]/60',
  secret: 'border-dashed border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-white/[0.05] cursor-not-allowed select-none',
};

const DIRTY_FRAME = 'border-[#5B4DFF]/60 bg-[#5B4DFF]/[0.04] dark:bg-[#5B4DFF]/10';
const INVALID_FRAME = 'border-red-400 dark:border-red-500 ring-2 ring-red-400/20';

const ICON_BOX_ACTIVE = 'bg-[#5B4DFF]/10 text-[#5B4DFF]';
const ICON_BOX_MUTED = 'bg-gray-200/70 text-gray-400 dark:bg-white/10 dark:text-gray-500';

export interface TileFrameProps {
  icon: TileIcon;
  label: string;
  tone: TileTone;
  /** Associe le libellé à son champ (édition). Sans lui, le libellé est un simple texte. */
  labelFor?: string;
  dirty?: boolean;
  error?: string;
  errorId?: string;
  /** Raison affichée sur le cadenas des cadres verrouillés. */
  lockReason?: string | null;
  /** Petite note sous la valeur (ex : explication du mot de passe grisé). */
  footnote?: string;
  children: React.ReactNode;
  'data-tile'?: string;
}

export function TileFrame({
  icon: Icon, label, tone, labelFor, dirty, error, errorId, lockReason, footnote, children, ...rest
}: TileFrameProps) {
  const muted = tone === 'locked' || tone === 'system' || tone === 'secret';
  const showLock = tone === 'secret' || tone === 'locked';
  const labelClass = 'text-xs font-medium text-gray-400 dark:text-gray-500';

  return (
    <div
      data-tile={rest['data-tile']}
      data-tone={tone}
      className={cn(
        'relative flex items-start gap-3 rounded-2xl border p-4',
        'transition-colors duration-200 motion-reduce:transition-none',
        TONE_FRAME[tone],
        dirty && !error && DIRTY_FRAME,
        error && INVALID_FRAME,
      )}
    >
      <div className={cn('flex items-center justify-center w-9 h-9 rounded-xl shrink-0', muted ? ICON_BOX_MUTED : ICON_BOX_ACTIVE)}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="min-w-0 flex-1">
        {labelFor ? (
          <label htmlFor={labelFor} className={cn(labelClass, 'block')}>{label}</label>
        ) : (
          <p className={labelClass}>{label}</p>
        )}
        {children}
        {footnote && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{footnote}</p>}
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {showLock && (
        <span className="absolute top-3 right-3 text-gray-400 dark:text-gray-500" title={lockReason ?? undefined}>
          <Lock className="w-3.5 h-3.5" aria-hidden />
          {lockReason && <span className="sr-only">{lockReason}</span>}
        </span>
      )}
      {dirty && !showLock && (
        <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-[#5B4DFF]" title="Modifié, non enregistré">
          <span className="sr-only">Modifié, non enregistré</span>
        </span>
      )}
    </div>
  );
}
