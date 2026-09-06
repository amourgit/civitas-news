// ============================================================
// src/pages/StatistiquesPage.tsx
// Refonte complète (voir maquette "Corelytics" fournie par
// l'utilisateur) : rangée de KPI compacts + graphiques barres/courbes/
// donut en verre dépoli, entièrement branchés sur
// statistiquesService.getStatistiquesGlobales() (même service que
// l'ancienne mouture en Bento, voir features/statistiques/). Les
// anciens composants Bento* ne sont pas supprimés (BentoAreaEvolution
// et BentoDonutCategories restent utilisés par HomeStatsPreviewSection
// sur la page d'accueil) -- seule cette page cesse de les utiliser.
// ============================================================

import React from 'react';
import { BarChart2, Sparkles, AlertTriangle } from 'lucide-react';
import { useSetSideContent } from '../context/SideContentContext';
import { GooglePartnerWidget } from '../components/widgets/GooglePartnerWidget';
import { AirtelGabonWidget } from '../components/widgets/AirtelGabonWidget';
import { useStatistiquesGlobales } from '../features/statistiques/hooks/useStatistiquesGlobales';
import { GLASS_CARD } from '../features/dashboards/glassStyles';
import { KpiMiniCard } from '../features/dashboards/statistiques/KpiMiniCard';
import { ProvinceBarPanel } from '../features/dashboards/statistiques/ProvinceBarPanel';
import { HourlyActivityPanel } from '../features/dashboards/statistiques/HourlyActivityPanel';
import { StatutsDonutPanel } from '../features/dashboards/statistiques/StatutsDonutPanel';

export default function StatistiquesPage() {
  const { stats, isLoading, error } = useStatistiquesGlobales();

  // Set custom side content for Statistiques Page
  useSetSideContent(
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-purple-900/10 via-indigo-900/10 to-blue-900/10 border border-purple-200/60 dark:border-purple-800/50 p-4 rounded-2xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-[#5B4DFF]" />
          <span>Tableau National de Bord</span>
        </div>
        <div className="text-xl font-black text-gray-900 dark:text-white font-display">
          CIVITAS Analytics
        </div>
        <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
          Les statistiques consolidées intègrent l'ensemble des suffrages exprimés dans les 9 provinces et la diaspora.
        </p>
      </div>

      <GooglePartnerWidget />
      <AirtelGabonWidget />
    </div>,
    []
  );

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 bg-gray-200/70 dark:bg-white/10 rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200/70 dark:bg-white/10 rounded-3xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-200/70 dark:bg-white/10 rounded-3xl" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center text-center gap-3 py-20 px-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Statistiques indisponibles</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Impossible de charger les statistiques pour le moment. Réessayez dans un instant.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      {/* Top Banner */}
      <div className={`${GLASS_CARD} p-4`}>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-[#5B4DFF]">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white font-display tracking-tight">
              Statistiques & Analyse Civique
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Visualisation temps réel de l'engagement populaire et de la démographie des consultations
            </p>
          </div>
        </div>
      </div>

      {/* Rangée de KPI compacts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiMiniCard title="Votes exprimés" value={stats.totalVotes} variation={stats.croissanceMensuelle} />
        <KpiMiniCard title="Commentaires" value={stats.totalCommentaires} subtitle="cumulés" />
        <KpiMiniCard title="Taux de transparence" value={Math.round(stats.tauxTransparence ?? 0)} format="percent" subtitle="publications avec lien officiel" />
        <KpiMiniCard title="Organisations partenaires" value={stats.totalOrganisations} />
      </div>

      {/* Barres (participation par province) + Donut (statuts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <ProvinceBarPanel data={stats.participationParProvince} />
        </div>
        <div className="lg:col-span-5">
          <StatutsDonutPanel data={stats.statutsConsultations ?? []} />
        </div>
      </div>

      {/* Courbes multiples (activité par heure) */}
      <HourlyActivityPanel data={stats.activiteParHeure} />
    </div>
  );
}
