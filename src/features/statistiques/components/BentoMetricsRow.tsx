import React from 'react';
import { Users, CheckSquare, MessageSquare, TrendingUp, ShieldCheck, ArrowUpRight, Newspaper } from 'lucide-react';
import { INITIAL_NEWS } from '../../../services/news.service';

interface MetricItem {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  subtext: string;
  icon: React.ReactNode;
}

export const BentoMetricsRow: React.FC = () => {
  const allNews = INITIAL_NEWS;

  const totalVotes = allNews.reduce((acc, curr) => acc + (curr.stats?.votes || 0), 0);
  const totalComments = allNews.reduce((acc, curr) => acc + (curr.stats?.commentaires || 0), 0);
  const totalShares = allNews.reduce((acc, curr) => acc + (curr.stats?.partages || 0), 0);
  const totalViews = allNews.reduce((acc, curr) => acc + (curr.stats?.vues || 0), 0);

  const metrics: MetricItem[] = [
    {
      label: 'Publications & News',
      value: allNews.length.toLocaleString(),
      change: '+14.2%',
      isPositive: true,
      subtext: `${totalViews.toLocaleString()} vues cumulées`,
      icon: <Newspaper className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
    },
    {
      label: 'Votes & Suffrages',
      value: totalVotes.toLocaleString(),
      change: '+22.8%',
      isPositive: true,
      subtext: 'Participation civique vérifiée',
      icon: <CheckSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
    },
    {
      label: 'Débats & Commentaires',
      value: totalComments.toLocaleString(),
      change: '+8.5%',
      isPositive: true,
      subtext: 'Modération IA à 99.4%',
      icon: <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      label: 'Partages Citoyens',
      value: totalShares.toLocaleString(),
      change: '+18.0%',
      isPositive: true,
      subtext: 'Diffusion multi-canaux',
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

