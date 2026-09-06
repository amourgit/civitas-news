import React from 'react';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { GLASS_CARD } from '../glassStyles';
import { formatNumber } from '../../../lib/formatNumber';

export interface BarMiniStatCardProps {
  title: string;
  value: number;
  variation?: number;
  bars: { label: string; value: number }[];
}

/** Carte "valeur + mini barres" (voir référence : carte "Average
 * Daily Sales"). La dernière barre est mise en avant, comme dans la
 * référence. */
export const BarMiniStatCard: React.FC<BarMiniStatCardProps> = ({ title, value, variation, bars }) => {
  return (
    <div className={`${GLASS_CARD} p-4 flex flex-col h-full`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-2xl font-extrabold text-gray-900 dark:text-white font-display">
          {formatNumber(value)}
        </span>
        {variation !== undefined && (
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
              variation >= 0
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-950/60 text-red-500'
            }`}
          >
            {variation >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {variation >= 0 ? '+' : ''}
            {variation}%
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-2">{title}</p>

      <div className="flex-1 min-h-[56px]">
        {bars.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                {bars.map((_, i) => (
                  <Cell key={i} fill={i === bars.length - 1 ? '#5B4DFF' : '#5B4DFF33'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center text-[11px] text-gray-400">Pas encore de données</div>
        )}
      </div>
    </div>
  );
};

export default BarMiniStatCard;
