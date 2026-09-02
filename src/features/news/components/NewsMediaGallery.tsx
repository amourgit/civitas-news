import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SujetMediaItem } from '../../../types/global.types';
import { extractYouTubeId } from '../../sujets/components/MediaDetailModal';
import { Video, Image as ImageIcon, Film, Sparkles, Eye, Clock, X, Calendar } from 'lucide-react';

interface NewsMediaGalleryProps {
  medias?: SujetMediaItem[];
  /**
   * Images simples de la galerie attachée à la News (modèle
   * NewsImageGalerie côté backend, related_name="galerie") -- distinctes
   * de `medias` (modèle NewsMedia : vidéos/audio/documents/images riches).
   * `News.galerie` n'expose qu'un tableau d'URLs (voir
   * NewsSerializer.get_galerie) : converties ci-dessous en items affichables.
   */
  galerie?: string[];
  newsTitre?: string;
  sujetTitre?: string;
  defaultImage?: string;
}

/** Concatène des classes conditionnelles (pas de clsx/tailwind-merge dans ce projet). */
function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/** Convertit les URLs simples de `News.galerie` en items affichables par le
 * bento -- ce champ ne porte aucune métadonnée (voir NewsSerializer côté
 * backend), seul un titre générique peut être dérivé. */
function galerieToMediaItems(galerie: string[], titreBase?: string): SujetMediaItem[] {
  return galerie.filter(Boolean).map((url, index) => ({
    id: `galerie-${index}-${url}`,
    type: 'image',
    url,
    titre: titreBase ? `${titreBase} — Image ${index + 1}` : `Image ${index + 1}`,
  }));
}

// Variété visuelle du bento selon la position et le nombre total d'items
// -- même logique de répartition qu'avant, adaptée au système col/row-span
// du LayoutGrid ci-dessous.
function getBentoSpanClass(index: number, total: number): string {
  if (total === 1) return 'md:col-span-3 md:row-span-2';
  if (total === 2) return 'md:col-span-1 md:row-span-2';

  switch (index % 5) {
    case 0:
      return 'md:col-span-2 md:row-span-2'; // Hero
    case 1:
      return 'md:col-span-1 md:row-span-1';
    case 2:
      return 'md:col-span-1 md:row-span-2'; // Tall
    case 3:
      return 'md:col-span-1 md:row-span-1';
    case 4:
      return 'md:col-span-2 md:row-span-1'; // Wide
    default:
      return 'md:col-span-1 md:row-span-1';
  }
}

function MediaThumb({ item }: { item: SujetMediaItem }) {
  const isVideo = item.type === 'video';
  const isYouTube = item.type === 'youtube';
  const youtubeId = isYouTube ? extractYouTubeId(item.url) : null;
  const thumbnail =
    item.thumbnail || (isYouTube && youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : item.url);

  if (isVideo) {
    return (
      <motion.video
        layoutId={`media-${item.id}`}
        src={item.url}
        poster={item.thumbnail || undefined}
        autoPlay
        muted
        loop
        playsInline
        className="object-cover absolute inset-0 h-full w-full"
      />
    );
  }

  return (
    <motion.img
      layoutId={`media-${item.id}`}
      src={thumbnail}
      className="object-cover absolute inset-0 h-full w-full"
      alt={item.titre}
    />
  );
}

function MediaTypeBadge({ item }: { item: SujetMediaItem }) {
  if (item.type === 'youtube') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-black/60 backdrop-blur-md text-white border border-white/10">
        <Film className="w-3 h-3 text-red-500 fill-red-500" />
        YouTube
      </span>
    );
  }
  if (item.type === 'video') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-black/60 backdrop-blur-md text-white border border-white/10">
        <Video className="w-3 h-3 text-[#7B61FF]" />
        Vidéo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-black/60 backdrop-blur-md text-white border border-white/10">
      <ImageIcon className="w-3 h-3 text-emerald-400" />
      Image
    </span>
  );
}

/** Contenu affiché dans la carte agrandie -- métadonnées réelles + lecteur
 * pour vidéo/YouTube (la vignette ne suffit plus une fois agrandie). */
function ExpandedContent({ item }: { item: SujetMediaItem }) {
  const isYouTube = item.type === 'youtube';
  const youtubeId = isYouTube ? extractYouTubeId(item.url) : null;

  return (
    <div className="space-y-2">
      {isYouTube && youtubeId && (
        <div className="aspect-video w-full rounded-xl overflow-hidden mb-2">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
            title={item.titre}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      <h3 className="text-base sm:text-lg font-extrabold text-white font-display leading-snug">{item.titre}</h3>
      {item.description && <p className="text-xs sm:text-sm text-gray-300">{item.description}</p>}
      <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1">
        {typeof item.vues === 'number' && (
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {item.vues} vues
          </span>
        )}
        {item.duree && (
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {item.duree}
          </span>
        )}
        {item.date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}

export const NewsMediaGallery: React.FC<NewsMediaGalleryProps> = ({
  medias,
  galerie,
  newsTitre,
  sujetTitre,
  defaultImage,
}) => {
  const [selected, setSelected] = useState<SujetMediaItem | null>(null);

  // Données réelles uniquement, plus aucun contenu factice : on affiche
  // TOUTES les images de la galerie (NewsImageGalerie -> `galerie`) suivies
  // des médias riches éventuels (NewsMedia -> `medias` : vidéos, audio,
  // documents, images annotées) -- les deux collections sont distinctes
  // côté backend et s'additionnent, elles ne se substituent pas l'une à
  // l'autre. La couverture ne sert plus que de dernier recours, quand la
  // News n'a ni galerie ni média riche. Rien à montrer -> la section
  // disparaît.
  const titreBase = newsTitre || sujetTitre;
  const items: SujetMediaItem[] = (() => {
    const galerieItems = galerie && galerie.length > 0 ? galerieToMediaItems(galerie, titreBase) : [];
    const mediaItems = medias && medias.length > 0 ? medias : [];
    const combined = [...galerieItems, ...mediaItems];
    if (combined.length > 0) return combined;
    return defaultImage ? [{ id: 'cover', type: 'image', url: defaultImage, titre: 'Image de couverture' }] : [];
  })();

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selected]);

  if (items.length === 0) return null;

  return (
    <section className="w-full py-4 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#7B61FF]/10 text-[#7B61FF] dark:bg-[#7B61FF]/20">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white font-display flex items-center gap-2">
              <span>Galerie Médias</span>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#7B61FF]/10 text-[#7B61FF]">
                {items.length}
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Cliquez sur un média pour l'agrandir</p>
          </div>
        </div>

        {items.some((i) => i.type === 'video' || i.type === 'youtube') && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
            <Sparkles className="w-3.5 h-3.5 text-[#7B61FF]" />
            <span>Lecture automatique en sourdine</span>
          </div>
        )}
      </div>

      {/* BENTO GRID -- morph shared-layout (LayoutGrid, design imposé) */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 auto-rows-[160px] sm:auto-rows-[190px] gap-3 sm:gap-4 relative">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            layoutId={`card-${item.id}`}
            onClick={() => setSelected(item)}
            className={cn(
              'relative overflow-hidden rounded-2xl bg-gray-900 cursor-pointer border border-gray-800/80 hover:border-[#7B61FF]/60 transition-colors duration-300 shadow-md hover:shadow-2xl group',
              getBentoSpanClass(index, items.length)
            )}
          >
            <MediaThumb item={item} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

            <div className="absolute top-3 left-3 z-10 pointer-events-none">
              <MediaTypeBadge item={item} />
            </div>
            {item.duree && (
              <div className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-gray-200 text-[10px] font-mono font-semibold pointer-events-none">
                {item.duree}
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-10 pointer-events-none">
              <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug">{item.titre}</h3>
              {typeof item.vues === 'number' && (
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1">
                  <Eye className="w-3 h-3" />
                  <span>{item.vues} vues</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Backdrop */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
            />
          )}
        </AnimatePresence>

        {/* Carte agrandie */}
        <AnimatePresence>
          {selected && (
            <motion.div
              layoutId={`card-${selected.id}`}
              className="fixed inset-0 m-auto z-50 h-[80vh] w-[92vw] md:w-[70vw] max-w-3xl rounded-2xl overflow-hidden bg-black shadow-2xl flex flex-col justify-end"
            >
              {selected.type !== 'youtube' && (
                <div className="absolute inset-0">
                  <MediaThumb item={selected} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="relative z-10 p-4 sm:p-6"
              >
                <ExpandedContent item={selected} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export const SujetMediaGallery = NewsMediaGallery;
export type { NewsMediaGalleryProps };
