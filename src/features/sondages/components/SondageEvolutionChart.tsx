import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export interface SondageEvolutionChartProps {
  data?: Array<{ date: string; votes: number }>;
}

const DEFAULT_DATA = [
  { date: '01 Jul', votes: 120 },
  { date: '05 Jul', votes: 450 },
  { date: '10 Jul', votes: 890 },
  { date: '15 Jul', votes: 1240 },
  { date: '20 Jul', votes: 1560 },
  { date: '25 Jul', votes: 1890 },
];

export const SondageEvolutionChart: React.FC<SondageEvolutionChartProps> = ({ data = DEFAULT_DATA }) => {
  return (
    <div className="w-full h-48 bg-white dark:bg-[#1A1F4D] rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Évolution de la participation</h4>
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5B4DFF" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#5B4DFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} tickLine={false} />
          <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1A1F4D', borderRadius: '12px', border: 'none', color: '#FFF' }}
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Area type="monotone" dataKey="votes" stroke="#5B4DFF" strokeWidth={2} fillOpacity={1} fill="url(#colorVotes)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
