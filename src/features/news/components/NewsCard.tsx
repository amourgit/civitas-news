import React from 'react';
import { News } from '../../../types/global.types';
import { TikTokHeartButton } from '../../../components/ui/TikTokHeartButton';
import { useOpenNewsDetail } from '../hooks/useOpenNewsDetail';
import { AlertCircle } from 'lucide-react';

export interface NewsCardProps {
  news?: News;
  sujet?: News;
  onUpdate?: (updated: News) => void;
  onOpenDetail?: (slug: string) => void;
  /** Classes de span de grille (bento) fournies par NewsGrid.tsx --
   * NewsCard ne connaît pas sa propre position dans la grille. */
  className?: string;
}

/**
 * Card "bento" : image de couverture plein cadre, titre/description en
 * verre dépoli (glassmorphism) ancrés en bas, réaction en icône seule à
 * gauche, bouton détails à droite -- design imposé (voir conversation),
 * calqué sur le modèle BentoCard fourni (eyebrow/titre/description sur
 * un graphic plein cadre). Aucune bordure visible.
 */
export const NewsCard: React.FC<NewsCardProps> = ({ news, sujet, onUpdate, onOpenDetail, className = '' }) => {
  const newsItem = news || sujet!;
  const openNewsDetailGlobal = useOpenNewsDetail();

  const heroMedia = newsItem.image || (newsItem.galerie && newsItem.galerie[0]) || null;
  const heroIsVideo = !!heroMedia && (heroMedia.endsWith('.mp4') || heroMedia.endsWith('.webm') || heroMedia.includes('video'));

  const handleOpenDetail = () => (onOpenDetail || openNewsDetailGlobal)(newsItem.slug);

  const handleCardClick = (e: React.MouseEvent) => {
    // Les éléments avec leur propre logique de clic (réaction, bouton
    // détails) sont marqués data-no-card-click ou sont des <button> --
    // on ne déclenche l'ouverture du détail que pour le reste de la card.
    if ((e.target as HTMLElement).closest('[data-no-card-click]')) return;
    handleOpenDetail();
  };

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpenDetail();
        }
      }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-gray-900 cursor-pointer shadow-md hover:shadow-2xl transition-shadow duration-300 ${className}`}
    >
      {/* Image/vidéo de couverture -- plein cadre */}
      <div className="absolute inset-0">
        {heroMedia ? (
          heroIsVideo ? (
            <video src={heroMedia} className="w-full h-full object-cover" muted loop playsInline autoPlay />
          ) : (
            <img
              src={heroMedia}
              alt={newsItem.titre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#5B4DFF] to-[#7B61FF]" />
        )}
        {/* Assombrit le tiers inférieur pour la lisibilité du texte, même
            avant le survol/le panneau verre dépoli. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
      </div>

      {/* Panneau verre dépoli : titre + description, ancré en bas */}
      <div className="relative z-10 mt-auto p-3 sm:p-4 backdrop-blur-md bg-black/25">
        <span className="inline-block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#B8AFFF]">
          {newsItem.categorie?.nom || newsItem.type}
        </span>
        <h3 className="mt-0.5 text-sm sm:text-base md:text-lg font-extrabold text-white font-display leading-tight line-clamp-2">
          {newsItem.titre}
        </h3>
        <p className="mt-1 text-[11px] sm:text-xs text-gray-200/90 line-clamp-2 sm:line-clamp-3">
          {newsItem.description}
        </p>

        {/* Barre d'actions : réaction (icône + compteur) à gauche, pile
            d'avatars des réacteurs au centre, détails à droite */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <div data-no-card-click className="shrink-0">
            <TikTokHeartButton
              newsId={newsItem.id}
              initialCount={newsItem.stats?.reactions?.coeur || 0}
              userReaction={newsItem.userReaction}
              onUpdate={onUpdate}
              iconOnly
            />
          </div>

          {newsItem.reacteursRecents && newsItem.reacteursRecents.length > 0 && (
            <div className="flex items-center -space-x-2 flex-1 justify-center min-w-0" data-no-card-click title={`Ont réagi : ${newsItem.reacteursRecents.map((u) => u.nomAffiche).join(', ')}`}>
              {newsItem.reacteursRecents.slice(0, 5).map((reacteur) =>
                reacteur.avatar ? (
                  <img
                    key={reacteur.id}
                    src={reacteur.avatar}
                    alt={reacteur.nomAffiche}
                    className="w-6 h-6 rounded-full object-cover border-2 border-black/40 ring-1 ring-white/20 shrink-0"
                  />
                ) : (
                  <div
                    key={reacteur.id}
                    className="w-6 h-6 rounded-full bg-[#7B61FF] border-2 border-black/40 ring-1 ring-white/20 flex items-center justify-center text-[9px] font-extrabold text-white shrink-0"
                  >
                    {reacteur.nomAffiche.charAt(0).toUpperCase()}
                  </div>
                )
              )}
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDetail();
            }}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm transition-colors shrink-0"
            aria-label="Voir les détails"
            title="Voir les détails"
          >
            <AlertCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const SujetCard = NewsCard;
export type SujetCardProps = NewsCardProps;
