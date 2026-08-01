import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export interface DonutChartProps {
  data: Array<{ category: string; count: number; percentage: number }>;
}

const COLORS = ['#5B4DFF', '#7B61FF', '#16A34A', '#F59E0B', '#3B82F6', '#EC4899'];

export const DonutChart: React.FC<DonutChartProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-[#1A1F4D] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm h-80 flex flex-col justify-between">
      <h3 className="text-sm font-extrabold text-gray-900 dark:text-white font-display mb-2">
        Répartition par Thématique
      </h3>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1A1F4D', borderRadius: '12px', border: 'none', color: '#FFF' }}
            />
            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
