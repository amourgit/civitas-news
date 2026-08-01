import React from 'react';
import { ArrowUpRight, TrendingUp, ShieldCheck, PieChart as PieIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const BentoImpactBalanceCard: React.FC = () => {
  const assetData = [
    { name: 'Estuaire (Libreville)', votes: 14200, percent: 36.5, color: '#5B4DFF' },
    { name: 'Haut-Katanga / Kivu', votes: 8900, percent: 22.8, color: '#F59E0B' },
    { name: 'Ogooué / Kongo Central', votes: 6400, percent: 16.4, color: '#10B981' },
  ];

  return (
    <div className="bg-white dark:bg-[#1A1F4D] rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between space-y-4">
      {/* Top Main Orange/Coral Gradient Card */}
      <div className="w-full bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 text-white rounded-2xl p-4 shadow-md shadow-rose-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-rose-100 uppercase tracking-wider">
            Volume d'Engagement Civique
          </span>
          <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white">
            <TrendingUp className="w-3 h-3" />
            +24.5%
          </span>
        </div>

        <div>
          <div className="text-2xl sm:text-3xl font-black font-display tracking-tight">
            384 940 <span className="text-sm font-normal opacity-90">Actions</span>
          </div>
          <p className="text-[10px] text-rose-100 mt-0.5">
            Votes, consultations et avis certifiés
          </p>
        </div>

        {/* Sub-pills */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/20">
          <div className="bg-black/15 rounded-xl p-2">
            <span className="text-[9px] text-rose-100 block">Votes Uniques</span>
            <span className="text-xs font-bold text-white">38,940</span>
          </div>
          <div className="bg-black/15 rounded-xl p-2">
            <span className="text-[9px] text-rose-100 block">Contributions</span>
            <span className="text-xs font-bold text-white">12,480</span>
          </div>
        </div>
      </div>

      {/* Donut Gauge & Top Regional Assets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-gray-100 dark:border-gray-800 pb-1.5">
          <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <PieIcon className="w-3.5 h-3.5 text-[#5B4DFF]" />
            Répartition par Pôle Régional
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
            Certifié
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Mini Donut */}
          <div className="w-16 h-16 shrink-0 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetData}
                  dataKey="votes"
                  cx="50%"
                  cy="50%"
                  innerRadius={18}
                  outerRadius={28}
                  paddingAngle={3}
                >
                  {assetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-gray-800 dark:text-white">
              75.7%
            </div>
          </div>

          {/* Regional asset list */}
          <div className="flex-1 space-y-1.5 text-xs">
            {assetData.map((asset, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: asset.color }} />
                  <span className="truncate text-gray-700 dark:text-gray-300 font-medium">
                    {asset.name}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-extrabold text-gray-900 dark:text-white">
                    {asset.votes.toLocaleString('fr-FR')}
                  </span>
                  <span className="text-[9px] text-emerald-500 font-bold ml-1">
                    +{asset.percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
