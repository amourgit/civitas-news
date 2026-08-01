import React from 'react';
import { Newspaper, ArrowUpRight, Flame, Building2 } from 'lucide-react';

export const CivicNewsWidget: React.FC = () => {
  const publications = [
    {
      id: '1',
      title: 'Guide des consultations publiques en RDC / Gabon',
      source: 'Ministère du Numérique',
      date: 'Aujourd\'hui',
      tag: 'Officiel',
    },
    {
      id: '2',
      title: 'Publication du rapport de synthèse sur les transports',
      source: 'Observatoire Civique',
      date: 'Hier',
      tag: 'Rapport',
    },
    {
      id: '3',
      title: 'Lancement du budget participatif universitaire 2026',
      source: 'Mutuelle Étudiante',
      date: '28 Juillet',
      tag: 'Jeunesse',
    },
  ];

  return (
    <div className="w-full max-w-full overflow-hidden bg-white dark:bg-[#1A1F4D] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-[#5B4DFF]" />
          <h4 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
            Publications & Communiqués
          </h4>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
          <Flame className="w-3 h-3 text-amber-500" />
          En vue
        </span>
      </div>

      <div className="space-y-2.5">
        {publications.map((pub) => (
          <div
            key={pub.id}
            className="group block p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-gray-100 dark:border-gray-700/50 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
              <span className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {pub.source}
              </span>
              <span>{pub.date}</span>
            </div>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-[#5B4DFF] dark:group-hover:text-purple-300 transition-colors line-clamp-2">
              {pub.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
