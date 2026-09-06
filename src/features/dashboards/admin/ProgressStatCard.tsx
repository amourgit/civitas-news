import React from 'react';
import { GLASS_CARD } from '../glassStyles';
import { formatNumber } from '../../../lib/formatNumber';

export interface ProgressStatCardProps {
  title: string;
  value: number;
  total: number;
  progressLabel: string;
}

/** Carte "valeur + progression" (voir référence : carte "Orders this
 * Month" / "1,048 to Goal"). Le ratio est un vrai ratio calculé
 * (traités / total), jamais un objectif inventé. */
export const ProgressStatCard: React.FC<ProgressStatCardProps> = ({ title, value, total, progressLabel }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className={`${GLASS_CARD} p-4 flex flex-col h-full justify-between`}>
      <div>
        <span className="text-2xl font-extrabold text-gray-900 dark:text-white font-display block">
          {formatNumber(value)}
        </span>
        <p className="text-xs text-gray-400">{title}</p>
      </div>

      <div className="space-y-1.5 mt-3">
        <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400">
          <span>{progressLabel}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-200/70 dark:bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-[#5B4DFF] transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
};

export default ProgressStatCard;
