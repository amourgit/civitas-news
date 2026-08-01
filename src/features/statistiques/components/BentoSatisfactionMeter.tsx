import React from 'react';
import { ThumbsUp, Users, Smartphone, MessageCircle } from 'lucide-react';

export const BentoSatisfactionMeter: React.FC = () => {
  const metrics = [
    { label: 'Audience Web', value: '46%', color: '#5B4DFF' },
    { label: 'Canal Airtel 0-Data', value: '34%', color: '#EF4444' },
    { label: 'Application Mobile', value: '15%', color: '#10B981' },
    { label: 'Interactions SMS', value: '5%', color: '#F59E0B' },
  ];

  return (
    <div className="bg-white dark:bg-[#1A1F4D] rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between space-y-3">
      {/* Header */}
      <div>
        <h3 className="text-xs font-bold text-gray-900 dark:text-white font-display flex items-center gap-1.5">
          <ThumbsUp className="w-4 h-4 text-[#5B4DFF]" />
          Canaux & Satisfaction Votante
        </h3>
        <p className="text-[10px] text-gray-500 dark:text-gray-400">
          Distribution des participations selon les canaux d'accès
        </p>
      </div>

      {/* Main Gauge / Counter */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
        <div>
          <span className="text-[10px] text-purple-600 dark:text-purple-300 font-bold block uppercase">
            Avis Positifs Collectés
          </span>
          <span className="text-xl font-black text-gray-900 dark:text-white font-display">
            32,455
          </span>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#5B4DFF] text-white flex items-center justify-center font-bold text-xs shadow-md shadow-purple-500/30">
          92%
        </div>
      </div>

      {/* Metrics breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {metrics.map((m, idx) => (
          <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/40">
            <div className="flex items-center gap-1.5 min-w-0 pr-1">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} />
              <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium truncate">
                {m.label}
              </span>
            </div>
            <span className="text-[11px] font-extrabold text-gray-900 dark:text-white shrink-0">
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
