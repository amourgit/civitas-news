import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useStatistiquesGlobales } from '../hooks/useStatistiquesGlobales';

export const BentoBarProvinces: React.FC = () => {
  const { stats } = useStatistiquesGlobales();

  const provinceData = (stats?.participationParProvince ?? []).map((p) => ({
    province: p.province,
    directVotes: p.votes,
    comments: p.commentaires ?? 0,
  }));

  return (
    <div className="bg-white dark:bg-[#1A1F4D] border border-gray-200/80 dark:border-gray-800 rounded-2xl p-4 shadow-sm h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-2.5">
        <div>
          <h3 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
            Engagement par Province
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Votes, débats et sondages (9 Provinces du Gabon)
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
          <span className="w-2 h-2 rounded-full bg-[#5B4DFF]" /> Votes
          <span className="w-2 h-2 rounded-full bg-[#34D399] ml-1" /> Débats
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="h-[180px] w-full pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={provinceData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
            <XAxis
              dataKey="province"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickFormatter={(val) => `${val / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0E1338',
                borderColor: '#374151',
                borderRadius: '12px',
                fontSize: '11px',
                color: '#fff',
              }}
              formatter={(val: any) => [`${Number(val).toLocaleString()}`, '']}
            />
            <Bar dataKey="directVotes" name="Votes Directs" fill="#5B4DFF" radius={[4, 4, 0, 0]} />
            <Bar dataKey="comments" name="Commentaires" fill="#34D399" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
