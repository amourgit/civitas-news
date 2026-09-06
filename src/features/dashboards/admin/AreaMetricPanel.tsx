import React from 'react';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, MoreHorizontal } from 'lucide-react';
import { GLASS_CARD, CHART_TOOLTIP_STYLE } from '../glassStyles';
import { formatNumber } from '../../../lib/formatNumber';

export interface AreaMetricPanelProps {
  title: string;
  subtitle: string;
  value: number;
  variation?: number;
  data: { label: string; value: number }[];
  color?: string;
  gradientId: string;
  height?: number;
}

/** Grand panneau "valeur + courbe" (voir référence : "Sales this
 * months" et "Discounted Product Sales"). Générique : alimenté soit
 * par l'évolution mensuelle des publications, soit par l'activité
 * horaire (votes + commentaires) -- voir AdminDashboardPage.tsx. */
export const AreaMetricPanel: React.FC<AreaMetricPanelProps> = ({
  title,
  subtitle,
  value,
  variation,
  data,
  color = '#5B4DFF',
  gradientId,
  height = 180,
}) => {
  return (
    <div className={`${GLASS_CARD} p-4 h-full flex flex-col`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-[11px] text-gray-400">{subtitle}</p>
        </div>
        <button type="button" className="p-1.5 rounded-lg text-gray-400 hover:bg-white/60 dark:hover:bg-white/5 shrink-0">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <span className="text-2xl font-extrabold text-gray-900 dark:text-white font-display">{formatNumber(value)}</span>
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

      <div className="flex-1 mt-2" style={{ minHeight: height }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: any) => [formatNumber(Number(v)), '']} />
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={3} fill={`url(#${gradientId})`} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[11px] text-gray-400">Pas encore de données</div>
        )}
      </div>
    </div>
  );
};

export default AreaMetricPanel;
