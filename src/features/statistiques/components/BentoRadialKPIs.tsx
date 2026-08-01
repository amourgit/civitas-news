import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const statusData = [
  { name: 'Adoptées par Décret', value: 68, color: '#34D399' },
  { name: 'En cours d\'Analyse', value: 24, color: '#5B4DFF' },
  { name: 'En Attente de Quorum', value: 8, color: '#F59E0B' },
];

export const BentoRadialKPIs: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#1A1F4D] border border-gray-200/80 dark:border-gray-800 rounded-2xl p-4 shadow-sm h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-2.5">
        <div>
          <h3 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
            Issus des Consultations
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Impact et suites gouvernementales
          </p>
        </div>
        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
          100% Vérifié
        </span>
      </div>

      {/* Radial circles layout */}
      <div className="grid grid-cols-3 gap-2 py-2">
        {/* Circle 1 */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { value: 68, fill: '#34D399' },
                    { value: 32, fill: 'rgba(156,163,175,0.15)' },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={18}
                  outerRadius={26}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  <Cell fill="#34D399" stroke="none" />
                  <Cell fill="rgba(156,163,175,0.15)" stroke="none" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <span className="absolute text-[10px] font-black text-gray-900 dark:text-white">
              68%
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 text-center line-clamp-1">
            Adoptées
          </span>
          <span className="text-[9px] text-gray-400 text-center">843 projets</span>
        </div>

        {/* Circle 2 */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { value: 24, fill: '#5B4DFF' },
                    { value: 76, fill: 'rgba(156,163,175,0.15)' },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={18}
                  outerRadius={26}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  <Cell fill="#5B4DFF" stroke="none" />
                  <Cell fill="rgba(156,163,175,0.15)" stroke="none" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <span className="absolute text-[10px] font-black text-gray-900 dark:text-white">
              24%
            </span>
          </div>
          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mt-1 text-center line-clamp-1">
            En étude
          </span>
          <span className="text-[9px] text-gray-400 text-center">298 dossiers</span>
        </div>

        {/* Circle 3 */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { value: 8, fill: '#F59E0B' },
                    { value: 92, fill: 'rgba(156,163,175,0.15)' },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={18}
                  outerRadius={26}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  <Cell fill="#F59E0B" stroke="none" />
                  <Cell fill="rgba(156,163,175,0.15)" stroke="none" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <span className="absolute text-[10px] font-black text-gray-900 dark:text-white">
              8%
            </span>
          </div>
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1 text-center line-clamp-1">
            En attente
          </span>
          <span className="text-[9px] text-gray-400 text-center">99 débats</span>
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800/80 pt-2 text-[10px] text-gray-400 flex items-center justify-between">
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
          <CheckCircle2 className="w-3 h-3" /> Transmis au parlement
        </span>
        <span>Mise à jour direct</span>
      </div>
    </div>
  );
};
