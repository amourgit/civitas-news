import React from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  RefreshCw,
} from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';
import { useMeteo } from '../../features/meteo/hooks/useMeteo';
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

      {/* Grille compacte -- 3 colonnes (3 lignes) en mobile, 9 colonnes
          (1 seule ligne) dès la tablette : les 9 provinces tiennent
          toujours entières, sans repli/bouton "voir plus". Cartes
          minimalistes (icône + ville + température) pour rester
          lisibles à cette taille réduite. */}
      <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 sm:gap-2">
        {isLoading || !meteo ? (
          Array.from({ length: 9 }).map((_, index) => (
            <Skeleton key={index} variant="card" height={84} className="rounded-xl" />
          ))
        ) : (
          meteo.map((item) => {
            const { Icon, iconClass } = CONDITION_META[item.condition];

            return (
              <div
                key={item.province}
                className="group relative overflow-hidden rounded-xl bg-white dark:bg-[#1A1F4D] border border-gray-200/80 dark:border-gray-800/80 p-1.5 sm:p-2 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center gap-0.5"
              >
                <div className="p-1 sm:p-1.5 rounded-lg bg-gray-50 dark:bg-gray-800/80 group-hover:scale-110 transition-transform">
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${iconClass}`} />
                </div>

                <div className="min-w-0 w-full">
                  <div className="text-[7px] sm:text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide truncate">
                    {item.province}
                  </div>
                  <h3 className="text-[10px] sm:text-xs font-extrabold text-gray-900 dark:text-white font-display leading-tight truncate">
                    {item.ville}
                  </h3>
                  <div className="text-xs sm:text-base font-black text-gray-900 dark:text-white font-display leading-none mt-0.5">
                    {item.temperatureC}°
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
