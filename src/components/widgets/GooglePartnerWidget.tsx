import React from 'react';
import { ExternalLink, Globe, Sparkles, CheckCircle2 } from 'lucide-react';

export const GooglePartnerWidget: React.FC = () => {
  return (
    <div className="w-full max-w-full overflow-hidden bg-gradient-to-br from-blue-900/10 via-indigo-900/10 to-purple-900/10 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-blue-200/70 dark:border-blue-800/50 rounded-2xl p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-blue-200/50 dark:border-blue-800/40 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider truncate">
            Google Workspace & IA
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
          Sponsor Officiel
        </span>
      </div>

      {/* Title & Description */}
      <div className="space-y-1">
        <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-snug flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="truncate">IA Citoyenne & Inclusivité Civique</span>
        </h4>
        <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
          Partenariat technique avec Google Cloud pour la traduction automatique multilingue et l'analyse sémantique des consultations citoyennes au Gabon.
        </p>
      </div>

      {/* Bullet points */}
      <ul className="space-y-1 text-[11px] text-gray-600 dark:text-gray-300">
        <li className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">Synthèse automatique de grands débats</span>
        </li>
        <li className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">Protection renforcée des données privées</span>
        </li>
      </ul>

      {/* Link button */}
      <a
        href="https://cloud.google.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-between w-full pt-2 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline border-t border-blue-100 dark:border-blue-900/50"
      >
        <span className="flex items-center gap-1">
          <Globe className="w-3.5 h-3.5" />
          Découvrir les initiatives Google Civic
        </span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
};
