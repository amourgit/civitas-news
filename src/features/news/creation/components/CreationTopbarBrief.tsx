// ============================================================
// src/features/news/creation/components/CreationTopbarBrief.tsx
// Niveau inférieur de la topbar (voir useSetTopbarContent('lower', ...)
// dans CreerNewsPage.tsx) : qui publie, pour quelle organisation, et
// avec quelle visibilité -- l'équivalent du bandeau
// "[Avatar] Nom  [Public ▾]" au-dessus du champ de saisie sur
// Facebook. L'avatar et l'aperçu d'organisation reflètent simplement
// l'état du formulaire (organisation choisie dans MetaFieldsRow) --
// seule la pastille de visibilité, à droite, est interactive : c'est
// le "bref" composant qui résume en un coup d'œil qui pourra voir la
// publication.
// ============================================================

import React from 'react';
import { Globe2, Lock, Users2 } from 'lucide-react';
import { Avatar } from '../../../../components/ui/Avatar';
import { FieldChipPopover } from './FieldChipPopover';
import type { Organisation, Utilisateur } from '../../../../types/global.types';

const VISIBILITE_META: Record<'public' | 'prive' | 'limite', { label: string; icon: typeof Globe2; hint: string }> = {
  public: { label: 'Public', icon: Globe2, hint: 'Visible par tout le monde' },
  limite: { label: 'Limité', icon: Users2, hint: 'Visible par un public restreint' },
  prive: { label: 'Privé', icon: Lock, hint: 'Visible uniquement sur autorisation' },
};

export interface CreationTopbarBriefProps {
  user: Utilisateur | null;
  organisation?: Organisation;
  visibilite: 'public' | 'prive' | 'limite';
  onVisibiliteChange: (value: 'public' | 'prive' | 'limite') => void;
  disabled?: boolean;
}

export const CreationTopbarBrief: React.FC<CreationTopbarBriefProps> = ({
  user,
  organisation,
  visibilite,
  onVisibiliteChange,
  disabled = false,
}) => {
  const current = VISIBILITE_META[visibilite];

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5 rounded-full border border-black/5 dark:border-white/10 bg-white/80 dark:bg-white/[0.08] backdrop-blur-sm py-1.5 pl-1.5 pr-4">
        <Avatar src={user?.avatar} name={user?.nomAffiche || 'Vous'} size="sm" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{user?.nomAffiche || 'Vous'}</p>
          {organisation && (
            <p className="truncate text-[11px] font-medium text-gray-500 dark:text-gray-400">Au nom de {organisation.nom}</p>
          )}
        </div>
      </div>

      <FieldChipPopover icon={current.icon} label="Visibilité" valueLabel={current.label} filled disabled={disabled}>
        {(close) => (
          <div className="space-y-0.5">
            {(Object.keys(VISIBILITE_META) as Array<keyof typeof VISIBILITE_META>).map((key) => {
              const meta = VISIBILITE_META[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { onVisibiliteChange(key); close(); }}
                  className={`flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
                    visibilite === key ? 'bg-[#5B4DFF]/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <meta.icon className={`w-4 h-4 mt-0.5 shrink-0 ${visibilite === key ? 'text-[#4739E0] dark:text-[#B8AFFF]' : 'text-gray-400'}`} />
                  <span>
                    <span className={`block text-sm font-semibold ${visibilite === key ? 'text-[#4739E0] dark:text-[#B8AFFF]' : 'text-gray-700 dark:text-gray-200'}`}>{meta.label}</span>
                    <span className="block text-xs text-gray-400">{meta.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </FieldChipPopover>
    </div>
  );
};
