import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ShieldCheck, Heart, UserCheck } from 'lucide-react';

const gaugeData = [
  { name: 'Index Score', value: 92, fill: '#5B4DFF' },
  { name: 'Remaining', value: 8, fill: '#E5E7EB' },
];

export const BentoGaugeParity: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#1A1F4D] border border-gray-200/80 dark:border-gray-800 rounded-2xl p-4 shadow-sm h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-2">
        <h3 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
          Inclusivité & Parité
        </h3>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
          Standard Conforme
        </span>
      </div>

      {/* Semi circle Gauge chart */}
      <div className="h-[140px] relative flex items-center justify-center my-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="75%"
              startAngle={180}
              endAngle={0}
              innerRadius={55}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
            >
              <Cell fill="#5B4DFF" stroke="none" />
              <Cell fill="rgba(156, 163, 175, 0.2)" stroke="none" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute bottom-2 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-gray-900 dark:text-white font-display">
            92%
          </span>
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
            Représentativité
          </span>
        </div>
      </div>

      {/* Demographics indicators */}
      <div className="space-y-1.5 border-t border-gray-100 dark:border-gray-800/80 pt-2 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-blue-500" /> Parité H / F
          </span>
          <span className="font-extrabold text-gray-900 dark:text-gray-100">49% / 51%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500" /> Tranche 18-35 ans
          </span>
          <span className="font-extrabold text-gray-900 dark:text-gray-100">64% des votants</span>
        </div>
      </div>
    </div>
  );
};
