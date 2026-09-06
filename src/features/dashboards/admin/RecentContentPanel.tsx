import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { GLASS_CARD } from '../glassStyles';
import { Badge } from '../../../components/ui/Badge';
import { formatDateRelative } from '../../../lib/formatDate';
import { formatNumber } from '../../../lib/formatNumber';
import type { News } from '../../../types/global.types';

const STATUT_VARIANT: Record<string, 'success' | 'warning' | 'default' | 'danger'> = {
  publie: 'success',
  brouillon: 'warning',
  archive: 'default',
  signale: 'danger',
};

const STATUT_LABEL: Record<string, string> = {
  publie: 'Publiée',
  brouillon: 'Brouillon',
  archive: 'Archivée',
  signale: 'Signalée',
};

export interface RecentContentPanelProps {
  news: News[];
  limit?: number;
}

/** Panneau "publications récentes" (voir référence : "Recent
 * Orders"). Les onglets sont les types RÉELLEMENT présents dans les
 * dernières publications -- pas une liste de catégories fixe. */
export const RecentContentPanel: React.FC<RecentContentPanelProps> = ({ news, limit = 8 }) => {
  const sorted = useMemo(
    () => [...news].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [news]
  );

  const typesPresents = useMemo(() => {
    const counts = new Map<string, number>();
    sorted.forEach((n) => counts.set(n.type, (counts.get(n.type) || 0) + 1));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([type]) => type as News['type']);
  }, [sorted]);

  const [activeType, setActiveType] = useState<News['type'] | 'tous'>('tous');

  const rows = useMemo(
    () => (activeType === 'tous' ? sorted : sorted.filter((n) => n.type === activeType)).slice(0, limit),
    [sorted, activeType, limit]
  );

  return (
    <div className={`${GLASS_CARD} p-4`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Publications récentes</h3>
      </div>

      <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveType('tous')}
          className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            activeType === 'tous' ? 'bg-[#5B4DFF] text-white' : 'bg-white/60 dark:bg-white/5 text-gray-600 dark:text-gray-300'
          }`}
        >
          Tous
        </button>
        {typesPresents.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveType(type)}
            className={`shrink-0 rounded-xl transition-colors ${activeType === type ? 'ring-2 ring-[#5B4DFF]' : ''}`}
          >
            <Badge variant="type" type={type as any} size="sm">
              {''}
            </Badge>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-gray-400 py-6 text-center">Aucune publication pour ce filtre.</p>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-white/10">
                <th className="pb-2 px-1">Publication</th>
                <th className="pb-2 px-1">Auteur</th>
                <th className="pb-2 px-1">Statut</th>
                <th className="pb-2 px-1 text-right">Vues</th>
                <th className="pb-2 px-1 text-right">Publiée</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((n) => (
                <tr key={n.id} className="border-b border-gray-50 dark:border-white/5 last:border-0">
                  <td className="py-2 px-1">
                    <Link to={`/news/${n.slug}`} className="flex items-center gap-2.5 min-w-0 group">
                      <img src={n.image} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0 bg-gray-100 dark:bg-white/10" />
                      <span className="font-semibold text-gray-800 dark:text-gray-100 truncate group-hover:text-[#5B4DFF] transition-colors">
                        {n.titre}
                      </span>
                    </Link>
                  </td>
                  <td className="py-2 px-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{n.auteur.nomAffiche}</td>
                  <td className="py-2 px-1">
                    <Badge variant={STATUT_VARIANT[n.statut] ?? 'default'} size="sm">
                      {STATUT_LABEL[n.statut] ?? n.statut}
                    </Badge>
                  </td>
                  <td className="py-2 px-1 text-right text-xs font-bold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3 h-3 text-gray-400" /> {formatNumber(n.stats.vues)}
                    </span>
                  </td>
                  <td className="py-2 px-1 text-right text-xs text-gray-400 whitespace-nowrap">{formatDateRelative(n.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentContentPanel;
