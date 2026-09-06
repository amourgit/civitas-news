import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { GLASS_CARD, CHART_COLORS } from '../glassStyles';
import { formatNumber } from '../../../lib/formatNumber';

export interface StatutsDonutPanelProps {
  data: { statut: string; label: string; pourcentage: number; compteur: number; couleur: string }[];
}

/** Panneau "donut + callouts" (voir référence : "Expenses analytics").
 * Alimenté par la répartition réelle des publications par statut
 * (StatistiquesGlobales.statutsConsultations, dérivée des News réelles
 * -- voir statistiques.service.ts). */
export const StatutsDonutPanel: React.FC<StatutsDonutPanelProps> = ({ data }) => {
  const total = useMemo(() => data.reduce((s, d) => s + d.compteur, 0), [data]);
  const callouts = useMemo(() => [...data].sort((a, b) => b.compteur - a.compteur).slice(0, 3), [data]);

  return (
    <div className={`${GLASS_CARD} p-4 h-full`}>
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Statuts des publications</h3>

      <div className="flex items-center gap-5">
        <div className="w-32 h-32 shrink-0 relative">
          {data.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} dataKey="compteur" nameKey="label" innerRadius={38} outerRadius={58} paddingAngle={3} stroke="none">
                    {data.map((d, i) => (
                      <Cell key={d.statut} fill={d.couleur || CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-extrabold text-gray-900 dark:text-white font-display">{formatNumber(total)}</span>
                <span className="text-[9px] text-gray-400">au total</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full rounded-full border-8 border-dashed border-gray-200 dark:border-white/10" />
          )}
        </div>

        <ul className="flex-1 space-y-2.5 min-w-0">
          {data.map((d, i) => (
            <li key={d.statut} className="flex items-center gap-2 text-xs min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.couleur || CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="text-gray-500 dark:text-gray-400 truncate flex-1">{d.label}</span>
              <span className="font-bold text-gray-800 dark:text-gray-100">{d.pourcentage}%</span>
            </li>
          ))}
          {data.length === 0 && <li className="text-xs text-gray-400">Pas encore de données</li>}
        </ul>
      </div>

      {callouts.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
          {callouts.map((c) => (
            <div key={c.statut} className="text-center">
              <p className="text-sm font-extrabold text-gray-900 dark:text-white">{formatNumber(c.compteur)}</p>
              <p className="text-[10px] text-gray-400 truncate">{c.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatutsDonutPanel;
