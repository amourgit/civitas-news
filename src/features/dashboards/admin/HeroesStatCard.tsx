import React from 'react';
import { GLASS_CARD } from '../glassStyles';
import { formatNumber } from '../../../lib/formatNumber';
import { Avatar } from '../../../components/ui/Avatar';
import type { Utilisateur } from '../../../types/global.types';

export interface HeroesStatCardProps {
  title: string;
  value: number;
  heroesLabel: string;
  topContributeurs: Utilisateur[];
  totalCount: number;
}

/** Carte "valeur + pile d'avatars" (voir référence : "New Customers
 * this Month" + "Today's Heroes"). Les avatars sont les VRAIS
 * contributeurs les plus actifs (stats.contributions), pas un
 * échantillon décoratif. */
export const HeroesStatCard: React.FC<HeroesStatCardProps> = ({ title, value, heroesLabel, topContributeurs, totalCount }) => {
  const shown = topContributeurs.slice(0, 4);
  const rest = Math.max(0, totalCount - shown.length);

  return (
    <div className={`${GLASS_CARD} p-4 flex flex-col h-full justify-between`}>
      <div>
        <span className="text-2xl font-extrabold text-gray-900 dark:text-white font-display block">
          {formatNumber(value)}
        </span>
        <p className="text-xs text-gray-400">{title}</p>
      </div>

      <div className="mt-3">
        <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{heroesLabel}</p>
        <div className="flex items-center">
          {shown.map((u) => (
            <Avatar key={u.id} src={u.avatar ?? undefined} name={u.nomAffiche} size="sm" className="-ml-2 first:ml-0" />
          ))}
          {rest > 0 && (
            <span className="-ml-2 w-7 h-7 rounded-full bg-[#5B4DFF]/10 text-[#5B4DFF] text-[10px] font-bold flex items-center justify-center ring-1 ring-white dark:ring-[#131A3D]">
              +{rest}
            </span>
          )}
          {shown.length === 0 && <span className="text-[11px] text-gray-400">Pas encore de contributeurs</span>}
        </div>
      </div>
    </div>
  );
};

export default HeroesStatCard;
