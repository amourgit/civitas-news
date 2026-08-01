import React from 'react';
import { Layers, ArrowUpRight, CheckCircle, FileText, Landmark, Bus } from 'lucide-react';

export const BentoTopConsultationsList: React.FC = () => {
  const consultations = [
    {
      id: '1',
      title: 'Modernisation du Réseau Routier',
      category: 'Infrastructures & Transport',
      icon: <Bus className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      votes: '14,820',
      change: '+5.2%',
      progress: 82,
      bgColor: 'bg-purple-50 dark:bg-purple-950/60',
    },
    {
      id: '2',
      title: 'Numérisation des Actes Civils',
      category: 'Services Publics & IA',
      icon: <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      votes: '11,450',
      change: '+8.1%',
      progress: 68,
      bgColor: 'bg-blue-50 dark:bg-blue-950/60',
    },
    {
      id: '3',
      title: 'Programme Électrification Rurale',
      category: 'Énergie & Environnement',
      icon: <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      votes: '8,940',
      change: '+3.4%',
      progress: 54,
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#1A1F4D] rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
        <h3 className="text-xs font-bold text-gray-900 dark:text-white font-display flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#5B4DFF]" />
          Sujets Majeurs à Forte Mobilisation
        </h3>
        <span className="text-[10px] text-gray-400 font-semibold uppercase">Top 3</span>
      </div>

      {/* Item list */}
      <div className="space-y-2.5">
        {consultations.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 border border-gray-100 dark:border-gray-700/50 transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className={`p-2 rounded-xl ${item.bgColor} shrink-0`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {item.title}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-400 truncate">{item.category}</span>
                  {/* Progress bar */}
                  <div className="w-12 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden shrink-0">
                    <div
                      className="bg-[#5B4DFF] h-full rounded-full"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs font-black text-gray-900 dark:text-white">
                {item.votes}
              </div>
              <span className="inline-flex items-center text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="w-2.5 h-2.5" />
                {item.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
