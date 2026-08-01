import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, Sparkles } from 'lucide-react';

const DEFAULT_LINE_DATA = [
  { time: '08:00', votes: 1200 },
  { time: '10:00', votes: 2400 },
  { time: '12:00', votes: 1800 },
  { time: '14:00', votes: 3900 },
  { time: '16:00', votes: 5715 }, // Peak
  { time: '18:00', votes: 4200 },
  { time: '20:00', votes: 3100 },
  { time: '22:00', votes: 1600 },
];

interface BentoAreaCurveCalloutProps {
  data?: Array<{ time: string; votes: number }>;
  title?: string;
  subtitle?: string;
}

export const BentoAreaCurveCallout: React.FC<BentoAreaCurveCalloutProps> = ({
  data = DEFAULT_LINE_DATA,
  title = "Flux de Participation en Temps Réel",
  subtitle = "Période de pic lors du Débat National de 16h00",
}) => {
  return (
    <div className="bg-white dark:bg-[#1A1F4D] rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between space-y-3 relative overflow-hidden">
      {/* Header with Callout Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white font-display flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#5B4DFF]" />
            {title}
          </h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>

        {/* Floating Callout badge as in the mockup */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 dark:border-emerald-500/40 px-2.5 py-1 rounded-xl text-emerald-700 dark:text-emerald-300 shadow-sm shrink-0">
          <div className="text-right">
            <span className="text-[9px] font-bold block text-gray-400 uppercase">Pic d'Affluence</span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">5,715 v/h</span>
          </div>
          <span className="flex items-center text-[10px] font-extrabold bg-emerald-500 text-white px-1.5 py-0.5 rounded-md">
            <TrendingUp className="w-3 h-3 mr-0.5" />
            +18%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5B4DFF" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#5B4DFF" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                borderRadius: '8px',
                border: 'none',
                color: '#FFF',
                fontSize: '11px',
              }}
              formatter={(value: any) => [`${value} votes`, 'Fréquentation']}
            />
            <Area
              type="monotone"
              dataKey="votes"
              stroke="#5B4DFF"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#purpleGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
