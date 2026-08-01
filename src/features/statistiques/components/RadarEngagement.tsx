import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';

const RADAR_DATA = [
  { metric: 'Vues', score: 92 },
  { metric: 'Votes', score: 85 },
  { metric: 'Commentaires', score: 78 },
  { metric: 'Partages', score: 64 },
  { metric: 'Réactions', score: 88 },
];

export const RadarEngagement: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#1A1F4D] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm h-80 flex flex-col justify-between">
      <h3 className="text-sm font-extrabold text-gray-900 dark:text-white font-display mb-2">
        Indice d'Engagement Citoyen
      </h3>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={RADAR_DATA}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="metric" stroke="#9CA3AF" tick={{ fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#374151" />
            <Radar name="Engagement" dataKey="score" stroke="#5B4DFF" fill="#5B4DFF" fillOpacity={0.5} />
            <Tooltip contentStyle={{ backgroundColor: '#1A1F4D', borderRadius: '12px', border: 'none', color: '#FFF' }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
