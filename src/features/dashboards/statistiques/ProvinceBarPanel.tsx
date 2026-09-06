import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { GLASS_CARD } from '../glassStyles';
import { formatNumber } from '../../../lib/formatNumber';

export interface ProvinceBarPanelProps {
  data: { province: string; votes: number; news: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const votes = payload[0]?.value ?? 0;
  return (
    <div className="rounded-2xl bg-[#0E1338] text-white px-3.5 py-2.5 shadow-xl border border-white/10 min-w-[140px]">
      <p className="text-[10px] text-gray-300 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-extrabold">{formatNumber(votes)} votes</p>
    </div>
  );
};

/** Panneau "barres + infobulle" (voir référence : "Sales analytics").
 * Alimenté par la participation réelle par province
 * (StatistiquesGlobales.participationParProvince). */
export const ProvinceBarPanel: React.FC<ProvinceBarPanelProps> = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const sorted = useMemo(() => [...data].sort((a, b) => b.votes - a.votes).slice(0, 9), [data]);
  const maxIndex = useMemo(
    () => (sorted.length ? sorted.reduce((best, d, i) => (d.votes > sorted[best].votes ? i : best), 0) : -1),
    [sorted]
  );

  return (
    <div className={`${GLASS_CARD} p-4 h-full flex flex-col`}>
      <div className="mb-2">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Participation par province</h3>
        <p className="text-[11px] text-gray-400">Votes exprimés, par province</p>
      </div>
      <div className="flex-1 min-h-[220px]">
        {sorted.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sorted}
              margin={{ top: 10, right: 5, left: 5, bottom: 0 }}
              onMouseMove={(state: any) => setActiveIndex(state?.activeTooltipIndex ?? null)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <XAxis dataKey="province" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }} interval={0} angle={-20} textAnchor="end" height={50} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(91,77,255,0.06)' }} />
              <Bar dataKey="votes" radius={[8, 8, 0, 0]} maxBarSize={28}>
                {sorted.map((_, i) => (
                  <Cell key={i} fill={i === activeIndex || (activeIndex === null && i === maxIndex) ? '#5B4DFF' : '#5B4DFF2E'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[11px] text-gray-400">Pas encore de données</div>
        )}
      </div>
    </div>
  );
};

export default ProvinceBarPanel;
