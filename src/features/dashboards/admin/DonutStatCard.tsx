import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { GLASS_CARD, CHART_COLORS } from '../glassStyles';
import { formatNumber } from '../../../lib/formatNumber';

export interface DonutStatCardProps {
  title: string;
  value: number;
  variation?: number;
  segments: { label: string; value: number }[];
}

/** Carte "valeur + donut de répartition" (voir référence : carte
 * "Expected Earnings"). Dégrade proprement (donut vide) si `segments`
 * est vide plutôt que de fabriquer des valeurs. */
export const DonutStatCard: React.FC<DonutStatCardProps> = ({ title, value, variation, segments }) => {
  const top = segments.slice(0, 3);
  const hasData = top.some((s) => s.value > 0);

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

      <div className="flex items-center gap-3 flex-1">
        <div className="w-16 h-16 shrink-0">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={top} dataKey="value" nameKey="label" innerRadius={18} outerRadius={30} paddingAngle={3} stroke="none">
                  {top.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full rounded-full border-4 border-dashed border-gray-200 dark:border-white/10" />
          )}
        </div>
        <ul className="flex-1 space-y-1 min-w-0">
          {top.map((s, i) => (
            <li key={s.label} className="flex items-center gap-1.5 text-[11px] min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="text-gray-500 dark:text-gray-400 truncate flex-1">{s.label}</span>
              <span className="font-bold text-gray-700 dark:text-gray-200">{formatNumber(s.value)}</span>
            </li>
          ))}
          {!hasData && <li className="text-[11px] text-gray-400">Pas encore de données</li>}
        </ul>
      </div>
    </div>
  );
};

export default DonutStatCard;
