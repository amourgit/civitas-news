import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { News } from '../../../types/global.types';
import { TikTokHeartButton } from '../../../components/ui/TikTokHeartButton';
import { AvatarGroup } from '../../../components/ui/AvatarGroup';
import { useOpenNewsDetail } from '../hooks/useOpenNewsDetail';
import { NewsCardCommentsDrawer } from './NewsCardCommentsDrawer';
import { AlertCircle, ChevronUp } from 'lucide-react';

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
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const heroMedia = newsItem.image || newsItem.galerie?.[0]?.url || null;
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

        {/* Barre d'actions : [cœur + avatars] à gauche | [détails] à droite.
            La flèche trappe n'est plus ici : c'est un bouton flottant
            indépendant du panneau (voir plus bas dans la card), sinon
            elle disparaît sous le tiroir (z-20 > panneau z-10) une fois
            celui-ci ouvert -- impossible de refermer sans elle. */}
        <div className="mt-2 flex items-center justify-between gap-2">
          {/* GAUCHE : réaction cœur + pile d'avatars animée des réacteurs */}
          <div className="flex items-center gap-1.5 shrink-0" data-no-card-click>
            <TikTokHeartButton
              newsId={newsItem.id}
              initialCount={newsItem.stats?.reactions?.coeur || 0}
              userReaction={newsItem.userReaction}
              onUpdate={onUpdate}
              iconOnly
            />
            {newsItem.reacteursRecents && newsItem.reacteursRecents.length > 0 && (
              <AvatarGroup
                items={newsItem.reacteursRecents.map((reacteur) => ({
                  id: reacteur.id,
                  name: reacteur.nomAffiche,
                  designation:
                    reacteur.role === 'administrateur'
                      ? 'Administrateur'
                      : reacteur.role === 'moderateur'
                      ? 'Modérateur'
                      : reacteur.role === 'etudiant'
                      ? 'Étudiant'
                      : 'Citoyen',
                  image: reacteur.avatar,
                }))}
                size="xs"
                maxVisible={4}
              />
            )}
          </div>

          {/* DROITE : bouton détail BottomSheet */}
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenDetail(); }}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm transition-colors shrink-0"
            aria-label="Voir les détails"
            data-no-card-click
          >
            <AlertCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bouton flottant flèche trappe : enfant DIRECT de la card (pas du
          panneau), indépendant de sa hauteur/contenu. Centré au bas de
          la card. Masqué (fondu + léger scale) quand le tiroir est
          ouvert : sinon il reste affiché par-dessus le composer de
          commentaire en bas du tiroir (z-30 > tiroir z-20) et gêne la
          saisie. La fermeture reste possible via la flèche dédiée en
          haut à droite du tiroir (voir NewsCardCommentsDrawer.tsx). */}
      <AnimatePresence>
        {!isCommentsOpen && (
          <motion.button
            key="comments-toggle"
            onClick={(e) => { e.stopPropagation(); setIsCommentsOpen(true); }}
            initial={{ opacity: 0, scale: 0.6, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm transition-colors"
            aria-label="Ouvrir les commentaires"
            data-no-card-click
          >
            <ChevronUp className="w-4 h-4 drop-shadow" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Tiroir commentaires : absolu, 100% largeur, 90% hauteur de LA
          CARD, slide bas -> haut, glassmorphisme transparent. Enfant
          DIRECT de la card (pas du panneau, dont la hauteur est "auto" --
          un h-[90%] posé dessus ne se serait pas résolu correctement).
          La card a une hauteur définie (grille bento, voir
          auto-rows-[...] dans NewsGrid.tsx), donc 90% s'y calcule
          correctement. overflow-hidden sur la card ne le clippe pas : il
          reste entièrement contenu dans sa boîte (inset-x-0, 90% de haut
          ancré en bas) -- et ça arrondit gratuitement ses coins bas
          carrés sur la forme arrondie de la card. */}
      <AnimatePresence>
        {isCommentsOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 h-[90%] rounded-t-2xl bg-black/40 backdrop-blur-xl overflow-hidden flex flex-col z-20"
          >
            <NewsCardCommentsDrawer newsId={newsItem.id} onClose={() => setIsCommentsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SujetCard = NewsCard;
export type SujetCardProps = NewsCardProps;
