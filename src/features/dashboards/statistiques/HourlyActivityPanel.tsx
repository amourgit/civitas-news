import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { GLASS_CARD, CHART_TOOLTIP_STYLE } from '../glassStyles';
import { formatNumber } from '../../../lib/formatNumber';

export interface HourlyActivityPanelProps {
  data: { heure: string; votes: number; commentaires: number }[];
}

/** Panneau "courbes multiples + infobulle" (voir référence : "Customer
 * satisfaction analysis"). Deux séries réelles (votes, commentaires) --
 * pas de 3e série inventée pour imiter la maquette. */
export const HourlyActivityPanel: React.FC<HourlyActivityPanelProps> = ({ data }) => {
  const { totalVotes, totalCommentaires } = useMemo(
    () => ({
      totalVotes: data.reduce((s, d) => s + d.votes, 0),
      totalCommentaires: data.reduce((s, d) => s + d.commentaires, 0),
    }),
    [data]
  );

  return (
    <div className={`${GLASS_CARD} p-4 h-full flex flex-col`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Activité par heure</h3>
          <p className="text-[11px] text-gray-400">Votes et commentaires enregistrés, sur 24h</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] shrink-0">
          <span className="flex items-center gap-1 font-bold text-[#5B4DFF]">
            <span className="w-2 h-2 rounded-full bg-[#5B4DFF]" /> {formatNumber(totalVotes)}
          </span>
          <span className="flex items-center gap-1 font-bold text-[#22D3EE]">
            <span className="w-2 h-2 rounded-full bg-[#22D3EE]" /> {formatNumber(totalCommentaires)}
          </span>
        </div>
      </div>
      <div className="flex-1 min-h-[220px]">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="heure" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ display: 'none' }} />
              <Line type="monotone" dataKey="votes" name="Votes" stroke="#5B4DFF" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="commentaires" name="Commentaires" stroke="#22D3EE" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[11px] text-gray-400">Pas encore de données</div>
        )}
      </div>
    </div>
  );
};

export default HourlyActivityPanel;
