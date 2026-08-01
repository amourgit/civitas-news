import React from 'react';
import { Users, CheckSquare, MessageSquare, TrendingUp, ShieldCheck, ArrowUpRight } from 'lucide-react';

interface MetricItem {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  subtext: string;
  icon: React.ReactNode;
}

export const BentoMetricsRow: React.FC = () => {
  const metrics: MetricItem[] = [
    {
      label: 'Citoyens Engagés',
      value: '124,580',
      change: '+14.2%',
      isPositive: true,
      subtext: 'vs mois dernier',
      icon: <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
    },
    {
      label: 'Votes Enregistrés',
      value: '482,910',
      change: '+22.8%',
      isPositive: true,
      subtext: '34,210 cette semaine',
      icon: <CheckSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
    },
    {
      label: 'Débats & Contributions',
      value: '89,340',
      change: '+8.5%',
      isPositive: true,
      subtext: 'Modération AI 99.4%',
      icon: <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      label: 'Consultations Clôturées',
      value: '1,240',
      change: '+12.0%',
      isPositive: true,
      subtext: '88% suivies d\'effet',
      icon: <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((m, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-[#1A1F4D] border border-gray-200/80 dark:border-gray-800 rounded-2xl p-3.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">
              {m.label}
            </span>
            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800/80">
              {m.icon}
            </div>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-black text-gray-900 dark:text-white font-display tracking-tight">
              {m.value}
            </span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                m.isPositive
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
              }`}
            >
              <ArrowUpRight className="w-2.5 h-2.5" />
              {m.change}
            </span>
          </div>

          <p className="mt-1 text-[10px] font-medium text-gray-400 dark:text-gray-500">
            {m.subtext}
          </p>
        </div>
      ))}
    </div>
  );
};
