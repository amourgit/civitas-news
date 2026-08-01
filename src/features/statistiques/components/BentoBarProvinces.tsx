import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const provinceData = [
  { province: 'EST', directVotes: 42000, comments: 18500, sondages: 9400 },
  { province: 'HOG', directVotes: 28000, comments: 12200, sondages: 6100 },
  { province: 'WNT', directVotes: 21500, comments: 9800, sondages: 4800 },
  { province: 'OGM', directVotes: 19800, comments: 8400, sondages: 4200 },
  { province: 'NGN', directVotes: 15200, comments: 6100, sondages: 3100 },
  { province: 'NYA', directVotes: 12100, comments: 4900, sondages: 2400 },
  { province: 'OGI', directVotes: 10400, comments: 4100, sondages: 2100 },
  { province: 'MOG', directVotes: 9800, comments: 3800, sondages: 1900 },
  { province: 'OGL', directVotes: 8600, comments: 3200, sondages: 1600 },
];

export const BentoBarProvinces: React.FC = () => {
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
