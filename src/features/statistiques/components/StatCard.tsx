import React from 'react';
import { Card } from '../../../components/ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber } from '../../../lib/formatNumber';

export interface StatCardProps {
  title: string;
  value: number;
  variation?: number;
  icon: React.ReactNode;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  variation,
  icon,
  subtitle,
}) => {
  return (
    <Card padding="md" className="flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</span>
        <div className="w-10 h-10 rounded-2xl bg-[#5B4DFF]/10 text-[#5B4DFF] flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-display">
          {formatNumber(value)}
        </div>
        {variation !== undefined && (
          <div className="flex items-center gap-1 text-xs font-bold">
            {variation >= 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5" /> +{variation}%
              </span>
            ) : (
              <span className="text-red-500 flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" /> {variation}%
              </span>
            )}
            <span className="text-gray-400 font-normal">vs mois dernier</span>
          </div>
        )}
        {subtitle && <span className="text-xs text-gray-400 block">{subtitle}</span>}
      </div>
    </Card>
  );
};
