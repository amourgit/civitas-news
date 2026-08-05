import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { useStatistiquesGlobales } from '../hooks/useStatistiquesGlobales';

interface BentoAreaEvolutionProps {
  className?: string;
}

export const BentoAreaEvolution: React.FC<BentoAreaEvolutionProps> = ({ className }) => {
  const [timeframe, setTimeframe] = useState<'mensuel' | 'trimestriel'>('mensuel');
  const { stats } = useStatistiquesGlobales();

  const monthlyData = useMemo(
    () => (stats?.evolutionMensuelle ?? []).map((m) => ({ month: m.mois, participation: m.participation })),
    [stats]
  );

  const { peakMonth, averageLabel } = useMemo(() => {
    if (monthlyData.length === 0) {
      return { peakMonth: null as string | null, averageLabel: null as string | null };
    }
    const peak = monthlyData.reduce((max, item) => (item.participation > max.participation ? item : max), monthlyData[0]);
    const average = monthlyData.reduce((sum, item) => sum + item.participation, 0) / monthlyData.length;
    return {
      peakMonth: peak.month,
      averageLabel: `${(average / 1000).toFixed(1)}k v/mois`,
    };
  }, [monthlyData]);

  const croissance = stats?.croissanceMensuelle;

  return (
    <div className={`bg-white dark:bg-[#1A1F4D] border border-gray-200/80 dark:border-gray-800 p-4 shadow-sm h-full flex flex-col justify-between ${className ?? 'rounded-2xl'}`}>
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800/80 pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
              Évolution de la Participation Citoyenne
            </h3>
            {croissance !== undefined && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {croissance >= 0 ? '+' : ''}{croissance}% Croissance
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Cumul des suffrages et contributions enregistrés par mois
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-[10px] font-bold">
          <button
            onClick={() => setTimeframe('mensuel')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              timeframe === 'mensuel'
                ? 'bg-white dark:bg-[#0E1338] text-[#5B4DFF] dark:text-purple-300 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setTimeframe('trimestriel')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              timeframe === 'trimestriel'
                ? 'bg-white dark:bg-[#0E1338] text-[#5B4DFF] dark:text-purple-300 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Trimestriel
          </button>
        </div>
      </div>

      {/* Main Graph Area */}
      <div className="h-[200px] w-full pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorParticipation" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5B4DFF" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#5B4DFF" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 600 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              tickFormatter={(v) => `${v / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0E1338',
                borderColor: '#374151',
                borderRadius: '12px',
                fontSize: '11px',
                color: '#fff',
              }}
              formatter={(val: any) => [`${Number(val).toLocaleString()} interactions`, 'Volume']}
            />
            <Area
              type="monotone"
              dataKey="participation"
              stroke="#5B4DFF"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorParticipation)"
              activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer KPI highlight */}
      <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800/80 pt-2 text-[11px] text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-purple-500" />
          {peakMonth ? (
            <>
              Pic observé en <strong>{peakMonth}</strong>
            </>
          ) : (
            'Chargement des données de participation…'
          )}
        </span>
        <span className="font-semibold text-gray-900 dark:text-gray-200">
          {averageLabel ? `Moyenne: ${averageLabel}` : ''}
        </span>
      </div>
    </div>
  );
};
