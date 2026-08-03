import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, ArrowRight, Activity, Sparkles } from 'lucide-react';
import { BentoAreaEvolution } from '../../features/statistiques/components/BentoAreaEvolution';
import { BentoDonutCategories } from '../../features/statistiques/components/BentoDonutCategories';

export const HomeStatsPreviewSection: React.FC = () => {
  return (
    <section className="w-full bg-white dark:bg-[#1A1F4D] rounded-none border border-gray-200/90 dark:border-gray-800 shadow-sm overflow-hidden my-4 transition-all">
      {/* Header Banner with "Voir plus" Button */}
      <div className="relative bg-gradient-to-r from-[#11163e] via-[#5B4DFF] to-[#1e1b4b] text-white p-4 sm:p-5 overflow-hidden rounded-none border-b border-gray-200 dark:border-gray-800">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-[10px] sm:text-xs font-black uppercase tracking-wider bg-white/15 text-purple-100 border border-white/20 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Transparence & Indicateurs Clés</span>
            </div>
            <h2 className="text-base sm:text-xl font-black font-display tracking-tight text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Statistiques & Engagement National
            </h2>
            <p className="text-xs text-blue-100/80 font-medium">
              Aperçu en temps réel de la participation citoyenne et de la répartition des consultations
            </p>
          </div>

          <Link
            to="/statistiques"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-white text-[#5B4DFF] hover:bg-purple-50 font-extrabold text-xs transition-all shadow-md active:scale-95 shrink-0 self-start sm:self-auto"
          >
            <BarChart2 className="w-4 h-4" />
            <span>Voir plus de statistiques</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Two Essential Graphs Grid */}
      <div className="p-3 sm:p-4 bg-gray-50/50 dark:bg-[#121638]/60 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 rounded-none">
        {/* Graph 1: Area Evolution (7 cols on lg) */}
        <div className="lg:col-span-7 rounded-none">
          <BentoAreaEvolution className="rounded-none border-gray-200 dark:border-gray-800" />
        </div>

        {/* Graph 2: Donut Categories (5 cols on lg) */}
        <div className="lg:col-span-5 rounded-none">
          <BentoDonutCategories className="rounded-none border-gray-200 dark:border-gray-800" />
        </div>
      </div>
    </section>
  );
};
