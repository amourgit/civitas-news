import React from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Wind,
  Droplets,
  MapPin,
  RefreshCw,
  CloudDrizzle,
} from 'lucide-react';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { Skeleton } from '../ui/Skeleton';
import { useMeteo } from '../../features/meteo/hooks/useMeteo';
import { formatDateRelative } from '../../lib/formatDate';
import type { ConditionMeteo } from '../../features/meteo/types/meteo.types';

/**
 * Section « Météo des Provinces » — vitrine du composant LiquidGlassCard
 * (glassmorphism, effet tactile draggable). Données mockées mais chargées
 * de façon dynamique via useMeteo (voir features/meteo), volontairement
 * isolées du reste des domaines de l'application.
 *
 * Note d'implémentation : LiquidGlassCard n'expose pas son état interne
 * `isExpanded` à ses enfants et ne clippe pas son contenu (pas
 * d'overflow-hidden dans le composant fourni) — on affiche donc toutes les
 * données directement plutôt que de masquer une partie derrière le mode
 * `expandable`, pour garantir un rendu fidèle en toutes circonstances.
 */

const CONDITION_META: Record<
  ConditionMeteo,
  { label: string; Icon: React.ElementType; iconClass: string }
> = {
  ensoleille: { label: 'Ensoleillé', Icon: Sun, iconClass: 'text-amber-500' },
  partiellement_nuageux: { label: 'Partiellement nuageux', Icon: CloudSun, iconClass: 'text-sky-500' },
  nuageux: { label: 'Nuageux', Icon: Cloud, iconClass: 'text-gray-400' },
  pluvieux: { label: 'Pluvieux', Icon: CloudRain, iconClass: 'text-blue-500' },
  orageux: { label: 'Orageux', Icon: CloudLightning, iconClass: 'text-purple-500' },
};

export const MeteoLiquidGlassSection: React.FC = () => {
  const { meteo, isLoading, refresh } = useMeteo();

  return (
    <section className="w-full bg-white dark:bg-[#1A1F4D] rounded-none border border-gray-200/90 dark:border-gray-800 shadow-sm overflow-hidden my-4 transition-all">
      {/* Header Banner — même langage visuel que les autres sections autonomes de la Home */}
      <div className="relative bg-gradient-to-r from-[#0b3c68] via-[#5B4DFF] to-[#0078d4] text-white p-4 sm:p-5 overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-[10px] sm:text-xs font-black uppercase tracking-wider bg-white/20 text-sky-100 border border-white/30 backdrop-blur-md">
              <CloudSun className="w-3.5 h-3.5 text-amber-300" />
              <span>Météo en Direct</span>
            </div>
            <h2 className="text-base sm:text-xl font-black font-display tracking-tight text-white">
              Météo des 9 Provinces du Gabon
            </h2>
            <p className="text-xs text-blue-100/80 font-medium">
              Température, humidité, vent et précipitations par province — glissez pour explorer
            </p>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0 self-start sm:self-auto disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Rangée de cartes en verre, une par province */}
      <div className="p-3 sm:p-4 bg-gray-50/50 dark:bg-[#121638]/60">
        <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
          {isLoading || !meteo
            ? Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} variant="card" width={176} height={216} className="shrink-0 !rounded-[32px]" />
              ))
            : meteo.map((item) => {
                const { label, Icon, iconClass } = CONDITION_META[item.condition];
                return (
                  <LiquidGlassCard
                    key={item.province}
                    width="176px"
                    className="shrink-0 bg-white/60 dark:bg-[#1A1F4D]/60 border border-white/40 dark:border-white/10"
                  >
                    <div className="w-[176px] p-3 flex flex-col gap-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                            <MapPin className="w-3 h-3" />
                            {item.province}
                          </div>
                          <div className="text-sm font-extrabold text-gray-900 dark:text-white font-display">
                            {item.ville}
                          </div>
                        </div>
                        <Icon className={`w-7 h-7 shrink-0 ${iconClass}`} />
                      </div>

                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-gray-900 dark:text-white font-display leading-none">
                            {item.temperatureC}°
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">
                            ressenti {item.temperatureRessentieC}°
                          </span>
                        </div>
                        <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                          {label}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-200/70 dark:border-gray-700/50 space-y-1.5 text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                        <div className="flex items-center gap-1.5">
                          <Droplets className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>Humidité : {item.humidite}%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Wind className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                          <span>Vent : {item.ventKmh} km/h</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CloudDrizzle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>Précip. : {item.precipitationMm} mm</span>
                        </div>
                        <div className="text-[9px] text-gray-400 pt-0.5">
                          Mis à jour {formatDateRelative(item.mesureAt)}
                        </div>
                      </div>
                    </div>
                  </LiquidGlassCard>
                );
              })}
        </div>
      </div>
    </section>
  );
};
