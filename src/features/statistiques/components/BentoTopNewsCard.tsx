import React from 'react';
import { Flame, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { INITIAL_NEWS } from '../../../services/news.service';

export const BentoTopNewsCard: React.FC = () => {
  const allNews = INITIAL_NEWS;

  // Sort by popularity (total votes + views + comments)
  const sortedNews = [...allNews]
    .sort((a, b) => {
      const scoreA = (a.stats?.votes || 0) + (a.stats?.commentaires || 0) + (a.stats?.partages || 0);
      const scoreB = (b.stats?.votes || 0) + (b.stats?.commentaires || 0) + (b.stats?.partages || 0);
      return scoreB - scoreA;
    })
    .slice(0, 4);

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
        <span className="text-[10px] font-bold text-gray-400">Classement Clé</span>
      </div>

      {/* List */}
      <div className="space-y-2 py-2">
        {sortedNews.map((item, index) => {
          const totalVotes = item.stats?.votes || item.stats?.commentaires || 0;
          const rank = index + 1;
          const growth = `+${10 + (4 - rank) * 6}%`;

          return (
            <Link
              key={item.id}
              to={`/news/${item.slug || item.id}`}
              className="flex items-center justify-between gap-3 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-all border border-gray-100 dark:border-gray-700/40 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-5 h-5 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 ${
                    rank === 1
                      ? 'bg-amber-400 text-amber-950'
                      : rank === 2
                      ? 'bg-slate-300 text-slate-900'
                      : rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {rank}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-[#5B4DFF]">
                    {item.titre}
                  </p>
                  <span className="text-[10px] font-medium text-gray-400 block">
                    {item.categorie?.nom || 'Actualité'} • {totalVotes.toLocaleString()} interactions
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <ArrowUpRight className="w-2.5 h-2.5" />
                  {growth}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export const BentoTopSujetsCard = BentoTopNewsCard;


