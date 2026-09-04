import React from 'react';
import { Building2, Calendar, MapPin, Eye, Share2, ShieldCheck } from 'lucide-react';
import { News } from '../../../../../types/global.types';
import { SidebarWidgetCard } from './SidebarWidgetCard';
import { formatNumber } from '../../../../../lib/formatNumber';

export interface InfoStatsWidgetProps {
  news: News;
}

/**
 * Widget "À propos de cette publication" -- reprend le contenu du
 * bloc "Cadre Institutionnel" affiché côté modal (initiateur, date de
 * lancement, mention de traçabilité) ainsi que la portée
 * géographique et quelques statistiques, restylés pour la sidebar
 * éditoriale plutôt que dupliqués tels quels.
 */
export const InfoStatsWidget: React.FC<InfoStatsWidgetProps> = ({ news }) => {
  const publishedOn = new Date(news.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const lieu = [news.lieu, news.province].filter(Boolean).join(', ');

  return (
    <SidebarWidgetCard title="À propos de cette publication">
      <div className="space-y-3 text-xs">
        <div className="flex items-start gap-2.5">
          <Building2 className="w-4 h-4 text-[#5B4DFF] shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wide">Initiateur</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {news.organisation?.nom || news.etablissement?.nom || news.auteur.nomAffiche}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <Calendar className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wide">Publié le</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">{publishedOn}</span>
          </div>
        </div>

        {lieu && (
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-gray-400 block font-semibold uppercase tracking-wide">
                Portée géographique
              </span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">{lieu}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 pt-3 mt-1 border-t border-gray-100 dark:border-gray-800">
          <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Eye className="w-3.5 h-3.5" />
            {formatNumber(news.stats.vues)} vues
          </span>
          <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Share2 className="w-3.5 h-3.5" />
            {formatNumber(news.stats.partages)} partages
          </span>
        </div>

        <div className="flex items-start gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
          Information enregistrée et traçable sur registre certifié CIVITAS.
        </div>
      </div>
    </SidebarWidgetCard>
  );
};
