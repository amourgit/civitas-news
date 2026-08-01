import React from 'react';
import { BarChart2, Download, RefreshCw, Sparkles, Filter } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { toast } from '../hooks/useToast';
import { useSetSideContent } from '../context/SideContentContext';
import { GooglePartnerWidget } from '../components/widgets/GooglePartnerWidget';
import { AirtelGabonWidget } from '../components/widgets/AirtelGabonWidget';

import { BentoMetricsRow } from '../features/statistiques/components/BentoMetricsRow';
import { BentoDonutCategories } from '../features/statistiques/components/BentoDonutCategories';
import { BentoBarProvinces } from '../features/statistiques/components/BentoBarProvinces';
import { BentoAreaEvolution } from '../features/statistiques/components/BentoAreaEvolution';
import { BentoGaugeParity } from '../features/statistiques/components/BentoGaugeParity';
import { BentoRadialKPIs } from '../features/statistiques/components/BentoRadialKPIs';
import { BentoTopNewsCard } from '../features/statistiques/components/BentoTopNewsCard';

export default function StatistiquesPage() {
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

  const handleExport = () => {
    toast('success', 'Rapport analytique complet (PDF/CSV) généré avec succès.');
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#1A1F4D] border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm">
        <div>
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

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast('info', 'Données mises à jour à l\'instant.')}
            className="text-xs gap-1.5 rounded-xl border-gray-200 dark:border-gray-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualiser
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExport}
            className="text-xs gap-1.5 rounded-xl bg-[#5B4DFF] hover:bg-purple-700 text-white"
          >
            <Download className="w-3.5 h-3.5" />
            Exporter Rapport
          </Button>
        </div>
      </div>

      {/* Row 1: KPI Summary Row */}
      <BentoMetricsRow />

      {/* Row 2: Donut Categories + Bar Provinces (Bento 2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <BentoDonutCategories />
        </div>
        <div className="lg:col-span-5">
          <BentoBarProvinces />
        </div>
      </div>

      {/* Row 3: Area Line Evolution + Gauge Parity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <BentoAreaEvolution />
        </div>
        <div className="lg:col-span-4">
          <BentoGaugeParity />
        </div>
      </div>

      {/* Row 4: Radial KPIs + Top Sujets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5">
          <BentoRadialKPIs />
        </div>
        <div className="lg:col-span-7">
          <BentoTopNewsCard />
        </div>
      </div>
    </div>
  );
}
