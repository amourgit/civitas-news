import React, { useState } from 'react';
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
  ChevronDown,
} from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';
import { useMeteo } from '../../features/meteo/hooks/useMeteo';
import { formatDateRelative } from '../../lib/formatDate';
import type { ConditionMeteo } from '../../features/meteo/types/meteo.types';

const CONDITION_META: Record<
  ConditionMeteo,
  { label: string; Icon: React.ElementType; iconClass: string; bgGradient: string }
> = {
  ensoleille: {
    label: 'Ensoleillé',
    Icon: Sun,
    iconClass: 'text-amber-500',
    bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
  },
  partiellement_nuageux: {
    label: 'Partiellement nuageux',
    Icon: CloudSun,
    iconClass: 'text-sky-500',
    bgGradient: 'from-sky-500/10 via-sky-500/5 to-transparent',
  },
  nuageux: {
    label: 'Nuageux',
    Icon: Cloud,
    iconClass: 'text-gray-400',
    bgGradient: 'from-gray-500/10 via-gray-500/5 to-transparent',
  },
  pluvieux: {
    label: 'Pluvieux',
    Icon: CloudRain,
    iconClass: 'text-blue-500',
    bgGradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
  },
  orageux: {
    label: 'Orageux',
    Icon: CloudLightning,
    iconClass: 'text-purple-500',
    bgGradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
  },
};

export const MeteoLiquidGlassSection: React.FC = () => {
  const { meteo, isLoading, refresh } = useMeteo();
  const [showAll, setShowAll] = useState(false);

  const displayList = meteo ? (showAll ? meteo : meteo.slice(0, 5)) : [];

  return (
    <div className="w-full my-4 space-y-3">
      {/* Titre sans cadre / sans section englobante */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-500">
            <CloudSun className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white font-display tracking-tight leading-none">
              Météo des Provinces
            </h2>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              Conditions et prévisions en temps réel sur les 9 provinces du Gabon
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={isLoading}
          title="Actualiser la météo"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1A1F4D] border border-gray-200/80 dark:border-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white shadow-sm hover:shadow transition-all disabled:opacity-60 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#5B4DFF] ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualiser</span>
        </button>
      </div>

      {/* Grille Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isLoading || !meteo ? (
          <>
            <Skeleton variant="card" height={190} className="sm:col-span-2 rounded-2xl" />
            <Skeleton variant="card" height={190} className="rounded-2xl" />
            <Skeleton variant="card" height={190} className="rounded-2xl" />
            <Skeleton variant="card" height={190} className="rounded-2xl" />
          </>
        ) : (
          displayList.map((item, index) => {
            const { label, Icon, iconClass, bgGradient } = CONDITION_META[item.condition];
            // Libreville, Franceville et Port-Gentil sont en Hero Bento (2 colonnes)
            const HERO_TILES = ['Libreville', 'Franceville', 'Port-Gentil', 'Estuaire', 'Haut-Ogooué', 'Ogooué-Maritime'];
            const isHero = HERO_TILES.includes(item.ville) || HERO_TILES.includes(item.province);

            return (
              <div
                key={item.province}
                className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-[#1A1F4D] border border-gray-200/80 dark:border-gray-800/80 p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between ${
                  isHero ? 'sm:col-span-2 lg:col-span-2 bg-gradient-to-br ' + bgGradient : ''
                }`}
              >
                {/* Accent de brillance en arrière-plan */}
                <div
                  className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-30 group-hover:opacity-60 ${
                    isHero ? 'bg-[#5B4DFF]/20' : 'bg-amber-500/10'
                  }`}
                />

                {/* En-tête de la carte */}
                <div className="flex items-start justify-between gap-2 relative z-10">
                  <div>
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <MapPin className="w-3 h-3 text-[#5B4DFF]" />
                      <span>{item.province}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white font-display leading-tight">
                      {item.ville}
                    </h3>
                  </div>

                  <div className="p-2 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50 shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className={`w-6 h-6 ${iconClass}`} />
                  </div>
                </div>

                {/* Bloc Température & Condition */}
                <div className="my-3 relative z-10 flex items-baseline justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white font-display tracking-tight">
                        {item.temperatureC}°
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        (ressenti {item.temperatureRessentieC}°)
                      </span>
                    </div>
                    <div className="text-xs font-bold text-gray-600 dark:text-gray-300 mt-0.5">
                      {label}
                    </div>
                  </div>
                </div>

                {/* Indicateurs météo détaillés */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80 grid grid-cols-3 gap-2 relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-blue-500" />
                      Humidité
                    </span>
                    <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 font-display">
                      {item.humidite}%
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                      <Wind className="w-3 h-3 text-cyan-500" />
                      Vent
                    </span>
                    <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 font-display">
                      {item.ventKmh} <span className="text-[9px] font-normal">km/h</span>
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                      <CloudDrizzle className="w-3 h-3 text-indigo-500" />
                      Pluie
                    </span>
                    <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 font-display">
                      {item.precipitationMm} <span className="text-[9px] font-normal">mm</span>
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-[9px] text-gray-400 text-right font-medium">
                  Màj {formatDateRelative(item.mesureAt)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bouton pour dérouler toutes les provinces */}
      {meteo && meteo.length > 5 && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-[#1A1F4D] border border-gray-200/80 dark:border-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/80 shadow-sm hover:shadow transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{showAll ? 'Réduire la météo' : `Voir les 9 provinces (${meteo.length - 5} de plus)`}</span>
            <ChevronDown className={`w-4 h-4 text-[#5B4DFF] transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
};
