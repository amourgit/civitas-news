import React from 'react';
import { Flame, ArrowUpRight, Award, MessageCircle, ThumbsUp } from 'lucide-react';

interface TopSujetItem {
  rank: number;
  title: string;
  category: string;
  votes: string;
  growth: string;
  status: 'Actif' | 'Clôturé';
}

const topSujets: TopSujetItem[] = [
  {
    rank: 1,
    title: 'Modernisation du réseau routier Libreville - Port-Gentil',
    category: 'Infrastructures',
    votes: '48.2k votes',
    growth: '+24%',
    status: 'Actif',
  },
  {
    rank: 2,
    title: 'Couverture médicale universelle & pharmacie de proximité',
    category: 'Santé',
    votes: '39.6k votes',
    growth: '+18%',
    status: 'Actif',
  },
  {
    rank: 3,
    title: 'Programme de bourses d\'études pour les filières STEM',
    category: 'Éducation',
    votes: '31.1k votes',
    growth: '+15%',
    status: 'Actif',
  },
  {
    rank: 4,
    title: 'Exonération fiscale pour les startups & PME gabonaises',
    category: 'Économie',
    votes: '28.4k votes',
    growth: '+11%',
    status: 'Clôturé',
  },
];

export const BentoTopNewsCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#1A1F4D] border border-gray-200/80 dark:border-gray-800 rounded-2xl p-4 shadow-sm h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-rose-500" />
          <h3 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
            News & Publications Phares
          </h3>
        </div>
        <span className="text-[10px] font-bold text-gray-400">Classement Hebdo</span>
      </div>

      {/* List */}
      <div className="space-y-2 py-2">
        {topSujets.map((item) => (
          <div
            key={item.rank}
            className="flex items-center justify-between gap-3 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-all border border-gray-100 dark:border-gray-700/40"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-5 h-5 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 ${
                  item.rank === 1
                    ? 'bg-amber-400 text-amber-950'
                    : item.rank === 2
                    ? 'bg-slate-300 text-slate-900'
                    : item.rank === 3
                    ? 'bg-amber-700 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {item.rank}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                  {item.title}
                </p>
                <span className="text-[10px] font-medium text-gray-400 block">
                  {item.category} • {item.votes}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <ArrowUpRight className="w-2.5 h-2.5" />
                {item.growth}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const BentoTopSujetsCard = BentoTopNewsCard;

