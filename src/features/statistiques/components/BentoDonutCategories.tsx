import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useNewsList } from '../hooks/useNewsList';

interface BentoDonutCategoriesProps {
  className?: string;
}

const CATEGORY_COLORS = ['#5B4DFF', '#34D399', '#F59E0B', '#3B82F6', '#EC4899', '#10B981', '#6366F1'];

export const BentoDonutCategories: React.FC<BentoDonutCategoriesProps> = ({ className }) => {
  const { news: allNews } = useNewsList();

  // Aggregate news & interactions by category
  const categoryMap: Record<string, { count: number; votes: number; color: string }> = {};

  allNews.forEach((item) => {
    const catName = item.categorie?.nom || 'Général';
    const votes = (item.stats?.votes || 0) + (item.stats?.commentaires || 0) + (item.stats?.partages || 0);
    const catColor = item.categorie?.couleur || CATEGORY_COLORS[Object.keys(categoryMap).length % CATEGORY_COLORS.length];

    if (!categoryMap[catName]) {
      categoryMap[catName] = { count: 0, votes: 0, color: catColor };
    }
    categoryMap[catName].count += 1;
    categoryMap[catName].votes += votes;
  });

  const totalVotes = Object.values(categoryMap).reduce((acc, curr) => acc + curr.votes, 0) || 1;
  const totalNewsCount = allNews.length;

  const data = Object.entries(categoryMap).map(([name, val]) => ({
    name,
    value: val.votes,
    count: val.count,
    percentage: Math.round((val.votes / totalVotes) * 100) || 1,
    color: val.color,
  }));

  return (
    <div className={`bg-white dark:bg-[#1A1F4D] border border-gray-200/80 dark:border-gray-800 p-4 shadow-sm h-full flex flex-col justify-between ${className ?? 'rounded-2xl'}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-2.5">
        <div>
          <h3 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
            Répartition par Thématique
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Poids des thèmes dans les actualités et publications (2026)
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">
          {totalNewsCount} News Actives
        </span>
      </div>

      {/* Main Body with Donut and Legend */}
      <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-3 py-2">
        {/* Donut Chart */}
        <div className="sm:col-span-5 h-[160px] relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={68}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0E1338',
                  borderColor: '#374151',
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: '#fff',
                }}
                formatter={(value: any) => [`${Number(value).toLocaleString()} engagements`, 'Volume']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-black text-gray-900 dark:text-white">{totalNewsCount}</span>
            <span className="text-[9px] text-gray-400 font-semibold uppercase">News</span>
          </div>
        </div>

        {/* Categories Legend List */}
        <div className="sm:col-span-7 space-y-1.5 pr-1">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-700 dark:text-gray-300 font-medium truncate text-[11px]">
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-gray-400 text-[10px] hidden xl:inline">
                  {item.count} news
                </span>
                <span className="font-extrabold text-gray-900 dark:text-white text-[11px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

