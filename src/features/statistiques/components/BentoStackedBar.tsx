import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const DEFAULT_BAR_DATA = [
  { month: 'Jan', web: 240, airtel: 180 },
  { month: 'Fév', web: 320, airtel: 290 },
  { month: 'Mar', web: 410, airtel: 380 },
  { month: 'Avr', web: 280, airtel: 210 },
  { month: 'Mai', web: 520, airtel: 450 },
  { month: 'Juin', web: 480, airtel: 390 },
  { month: 'Juil', web: 610, airtel: 540 },
];

interface BentoStackedBarProps {
  data?: Array<{ month: string; web: number; airtel: number }>;
  title?: string;
  subtitle?: string;
}

export const BentoStackedBar: React.FC<BentoStackedBarProps> = ({
  data = DEFAULT_BAR_DATA,
  title = "Participation par Canal (Web vs Airtel 0-Data)",
  subtitle = "Comparatif du volume mensuel de votes enregistrés",
}) => {
  return (
    <div className="bg-white dark:bg-[#1A1F4D] rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white font-display">
            {title}
          </h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-[#5B4DFF]">
          0-Data Actif
        </span>
      </div>

      {/* Chart */}
      <div className="w-full h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={14}>
            <XAxis
              dataKey="month"
              stroke="#9CA3AF"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#9CA3AF"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                borderRadius: '8px',
                border: 'none',
                color: '#FFF',
                fontSize: '11px',
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '10px', paddingBottom: '8px' }}
            />
            <Bar dataKey="web" name="Portail Web (Wifi/Data)" stackId="a" fill="#5B4DFF" radius={[0, 0, 0, 0]} />
            <Bar dataKey="airtel" name="Airtel 0-Data / SMS" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
