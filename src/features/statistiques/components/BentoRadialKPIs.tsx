import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CheckCircle2 } from 'lucide-react';
import { useStatistiquesGlobales } from '../hooks/useStatistiquesGlobales';

/** Unité affichée sous le compteur, selon le statut (vocabulaire UI, pas une donnée métier). */
const UNITE_PAR_STATUT: Record<string, string> = {
  // Mode mock — statuts illustratifs.
  adoptee: 'projets',
  analyse: 'dossiers',
  attente: 'débats',
  // Mode réel — distribution par statut de publication (news/models.py).
  publie: 'publications',
  brouillon: 'brouillons',
  archive: 'archives',
  signale: 'signalements',
};

export const BentoRadialKPIs: React.FC = () => {
  const { stats } = useStatistiquesGlobales();
  const statuts = stats?.statutsConsultations ?? [];

  return (
    <div className="bg-white dark:bg-[#1A1F4D] border border-gray-200/80 dark:border-gray-800 rounded-2xl p-4 shadow-sm h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-2.5">
        <div>
          <h3 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
            Issus des Consultations
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Impact et suites gouvernementales
          </p>
        </div>
        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
          100% Vérifié
        </span>
      </div>

      {/* Radial circles layout */}
      <div className="grid grid-cols-3 gap-2 py-2">
        {statuts.map((item) => (
          <div key={item.statut} className="flex flex-col items-center">
            <div className="w-14 h-14 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { value: item.pourcentage, fill: item.couleur },
                      { value: 100 - item.pourcentage, fill: 'rgba(156,163,175,0.15)' },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={18}
                    outerRadius={26}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    <Cell fill={item.couleur} stroke="none" />
                    <Cell fill="rgba(156,163,175,0.15)" stroke="none" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <span className="absolute text-[10px] font-black text-gray-900 dark:text-white">
                {item.pourcentage}%
              </span>
            </div>
            <span
              className="text-[10px] font-bold mt-1 text-center line-clamp-1"
              style={{ color: item.couleur }}
            >
              {item.label}
            </span>
            <span className="text-[9px] text-gray-400 text-center">
              {item.compteur} {UNITE_PAR_STATUT[item.statut] ?? ''}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800/80 pt-2 text-[10px] text-gray-400 flex items-center justify-between">
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
          <CheckCircle2 className="w-3 h-3" /> Transmis au parlement
        </span>
        <span>Mise à jour direct</span>
      </div>
    </div>
  );
};
