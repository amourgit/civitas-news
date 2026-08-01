import React from 'react';
import { ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

interface BentoSemiCircleGaugeProps {
  score?: number; // 0 to 100
  title?: string;
  subtitle?: string;
}

export const BentoSemiCircleGauge: React.FC<BentoSemiCircleGaugeProps> = ({
  score = 88,
  title = "Confiance & Traçabilité Civique",
  subtitle = "Score d'intégrité de la plateforme",
}) => {
  // Semi-circle gauge calculation
  const radius = 52;
  const circumference = Math.PI * radius; // Half circle
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white dark:bg-[#1A1F4D] rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between space-y-3">
      {/* Header */}
      <div>
        <h3 className="text-xs font-bold text-gray-900 dark:text-white font-display flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          {title}
        </h3>
        <p className="text-[10px] text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>

      {/* SVG Semi-circle gauge */}
      <div className="flex flex-col items-center justify-center my-1 relative">
        <svg className="w-36 h-20" viewBox="0 0 120 70">
          {/* Background track */}
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke="currentColor"
            className="text-gray-200 dark:text-gray-800"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Active gauge track */}
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5B4DFF" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>

        {/* Value overlay */}
        <div className="absolute bottom-1 text-center">
          <span className="text-xl font-black text-gray-900 dark:text-white font-display">
            {score}%
          </span>
          <span className="text-[9px] text-gray-400 block font-bold uppercase tracking-wider">
            Indice de Confiance
          </span>
        </div>
      </div>

      {/* Sub metrics */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 text-[10px]">
        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">Votes Horodatés: 100%</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
          <Lock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          <span className="truncate">Anonymat Garanti</span>
        </div>
      </div>
    </div>
  );
};
