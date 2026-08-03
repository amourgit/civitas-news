import React from 'react';
import { Layers, ArrowUpRight, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { INITIAL_NEWS } from '../../../services/news.service';

export const BentoTopConsultationsList: React.FC = () => {
  const topNews = INITIAL_NEWS.slice(0, 3);

  return (
    <div className="bg-white dark:bg-[#1A1F4D] rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
        <h3 className="text-xs font-bold text-gray-900 dark:text-white font-display flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#5B4DFF]" />
          News & Publications à Forte Mobilisation
        </h3>
        <span className="text-[10px] text-gray-400 font-semibold uppercase">Top 3</span>
      </div>

      {/* Item list */}
      <div className="space-y-2.5">
        {topNews.map((item, idx) => {
          const totalInteractions = (item.stats?.votes || 0) + (item.stats?.commentaires || 0);
          const progress = Math.min(100, Math.max(30, 95 - idx * 18));

          return (
            <Link
              key={item.id}
              to={`/news/${item.slug || item.id}`}
              className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/40 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 border border-gray-100 dark:border-gray-700/50 transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#5B4DFF] shrink-0">
                  <Newspaper className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-[#5B4DFF]">
                    {item.titre}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-400 truncate">{item.categorie?.nom}</span>
                    {/* Progress bar */}
                    <div className="w-12 bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden shrink-0">
                      <div
                        className="bg-[#5B4DFF] h-full rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-black text-gray-900 dark:text-white">
                  {totalInteractions.toLocaleString()}
                </div>
                <span className="inline-flex items-center text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="w-2.5 h-2.5" />
                  +{12 - idx * 3}%
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

