import React from 'react';
import { News } from '../../../types/global.types';

export interface NewsCardAuthorBadgeProps {
  news: News;
}

/**
 * Badge flottant en haut à gauche de la card : auteur du post et
 * tenant (organisation) auquel il appartient (déjà exposés par l'API
 * -- `NewsListSerializer.auteur` / `.organisation`, voir
 * `types/models/news.types.ts` -- aucun changement backend requis).
 * Même traitement verre dépoli que le menu du coin opposé, pour ne
 * jamais gêner le média de la card. Légèrement estompé au repos,
 * rétabli à pleine opacité au survol/focus de la card (le parent
 * NewsCard porte déjà la classe `group`).
 */
export const NewsCardAuthorBadge: React.FC<NewsCardAuthorBadgeProps> = ({ news }) => {
  const auteur = news.auteur;
  const organisation = news.organisation;

  if (!auteur) return null;

  return (
    <div
      className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-30 flex items-center gap-1.5 sm:gap-2 max-w-[62%] sm:max-w-[65%] rounded-full bg-white/10 backdrop-blur-2xl border border-white/25 shadow-xl shadow-black/20 pl-1 pr-2.5 sm:pr-3 py-1 opacity-75 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300"
      data-no-card-click
    >
      <div className="relative shrink-0">
        {auteur.avatar ? (
          <img
            src={auteur.avatar}
            alt={auteur.nomAffiche}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-white/40"
          />
        ) : (
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-[10px] font-bold text-white">
            {auteur.nomAffiche?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        {organisation?.logo && (
          <img
            src={organisation.logo}
            alt={organisation.nom}
            className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full object-cover border border-white/70 bg-white"
          />
        )}
      </div>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[11px] sm:text-xs font-semibold text-white">
          {auteur.nomAffiche}
        </p>
        {organisation?.nom && (
          <p className="truncate text-[9px] sm:text-[10px] text-white/70">
            {organisation.nom}
          </p>
        )}
      </div>
    </div>
  );
};

export default NewsCardAuthorBadge;
