import React from 'react';
import { Smartphone, Signal, ExternalLink, Zap } from 'lucide-react';

export const AirtelGabonWidget: React.FC = () => {
  return (
    <div className="w-full max-w-full overflow-hidden bg-gradient-to-br from-red-900/10 via-rose-900/10 to-amber-900/10 dark:from-red-950/40 dark:via-rose-950/40 dark:to-amber-950/40 border border-red-200/70 dark:border-red-800/50 rounded-2xl p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-red-200/50 dark:border-red-800/40 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm">
            a
          </div>
          <span className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider truncate">
            Airtel Gabon
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 shrink-0">
          Connectivité 0-Data
        </span>
      </div>

      {/* Content */}
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-snug flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-red-500 shrink-0" />
          <span className="truncate">Accès Gratuit aux Sondages Civiques</span>
        </h4>
        <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
          Participez aux consultations et votez sur CIVITAS sans consommer votre forfait internet mobile grâce au réseau national 4G+ Airtel.
        </p>
      </div>

      {/* Info Pills */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <span className="text-[10px] font-semibold bg-white/80 dark:bg-gray-800/80 text-red-600 dark:text-red-300 px-2 py-1 rounded-md border border-red-100 dark:border-red-900/50 flex items-center gap-1">
          <Signal className="w-3 h-3 text-red-500" />
          Couverture 9 Provinces
        </span>
        <span className="text-[10px] font-semibold bg-white/80 dark:bg-gray-800/80 text-red-600 dark:text-red-300 px-2 py-1 rounded-md border border-red-100 dark:border-red-900/50 flex items-center gap-1">
          <Smartphone className="w-3 h-3 text-red-500" />
          SMS Votations
        </span>
      </div>

      <a
        href="https://www.airtel.ga"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-between w-full pt-2 text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline border-t border-red-100 dark:border-red-900/50"
      >
        <span>Consulter le portail Airtel Gabon</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};
