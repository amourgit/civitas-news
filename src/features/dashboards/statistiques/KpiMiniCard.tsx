import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { GLASS_CARD } from '../glassStyles';
import { formatNumber } from '../../../lib/formatNumber';

export interface KpiMiniCardProps {
  title: string;
  value: number;
  format?: 'number' | 'percent';
  variation?: number;
  subtitle?: string;
}

/** Carte KPI compacte (voir référence : "Total sales" / "Total
 * expenses" / "Customer satisfaction score" / "Overall AI impact
 * score" -- 4 cartes en tête de dashboard). */
export const KpiMiniCard: React.FC<KpiMiniCardProps> = ({ title, value, format = 'number', variation, subtitle }) => {
  const displayValue = format === 'percent' ? `${value}%` : formatNumber(value);

  return (
    <div className={`${GLASS_CARD} p-4`}>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{title}</p>
      <div className="flex items-center gap-2">
        <span className="text-xl font-extrabold text-gray-900 dark:text-white font-display">{displayValue}</span>
        {variation !== undefined && (
          <span
            className={`text-[11px] font-bold flex items-center gap-0.5 ${
              variation >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
            }`}
          >
            {variation >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {variation >= 0 ? '+' : ''}
            {variation}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
};

export default KpiMiniCard;
