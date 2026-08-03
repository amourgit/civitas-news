import React, { useState } from 'react';
import { SujetMediaItem } from '../../../types/global.types';
import { MediaDetailModal, extractYouTubeId } from '../../sujets/components/MediaDetailModal';
import {
  Video,
  Image as ImageIcon,
  Play,
  Film,
  Sparkles,
  ExternalLink,
  Eye,
} from 'lucide-react';

interface SujetMediaGalleryProps {
  medias?: SujetMediaItem[];
  newsTitre?: string;
  sujetTitre?: string;
  defaultImage?: string;
}

// Fallback high-quality Bento media items if a sujet has no medias attached
const DEFAULT_BENTO_MEDIAS: SujetMediaItem[] = [
  {
    id: 'media-hero-1',
    type: 'video',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-group-of-friends-partying-happily-4640-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
    titre: 'Plan Mobilité & Consultation Nationale - Vue d\'ensemble',
    description: 'Présentation vidéo officielle des enjeux de la mobilité étudiante et des réformes proposées.',
    duree: '02:45',
    vues: 3420,
    date: 'Juillet 2026',
  },
  {
    id: 'media-yt-2',
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    titre: 'Débat Public : Pourquoi réformer les transports universitaires ?',
    description: 'Analyse approfondie et questions citoyennes posées aux experts de la commission nationale.',
    duree: '14:20',
    vues: 8900,
    date: 'Juillet 2026',
  },
  {
    id: 'media-img-3',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1000&auto=format&fit=crop&q=80',
    titre: 'Infrastructures & Flotte d\'Autobus Éco-Étudiant',
    description: 'Aperçu du futur réseau provincial de bus à haut niveau de service.',
    vues: 1250,
    date: 'Juin 2026',
  },
  {
    id: 'media-vid-4',
    type: 'video',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-11-large.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1477959858617-67f30bc4fc39?w=800&auto=format&fit=crop&q=80',
    titre: 'Circulation & Lignes Express Inter-Campus au Crépuscule',
    description: 'Etude de flux et perspectives sur la desserte nocturne sécurisée pour les bibliothèques universitaires.',
    duree: '01:30',
    vues: 2100,
    date: 'Juillet 2026',
  },
  {
    id: 'media-img-5',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&auto=format&fit=crop&q=80',
    titre: 'Solidarité & Bourses Étudiantes : Prise en charge à 100%',
    description: 'Synthèse graphique des bénéficiaires et du calendrier de mise en œuvre du Pass Mobilité.',
    vues: 4180,
    date: 'Juillet 2026',
  },
];

export const NewsMediaGallery: React.FC<SujetMediaGalleryProps> = ({
  medias,
  sujetTitre,
  defaultImage,
}) => {
  const [selectedMedia, setSelectedMedia] = useState<SujetMediaItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use provided medias or fallback to rich default Bento gallery
  const galleryItems =
    medias && medias.length > 0 ? medias : DEFAULT_BENTO_MEDIAS;

  const handleOpenModal = (item: SujetMediaItem) => {
    setSelectedMedia(item);
    setIsModalOpen(true);
  };

  // Assign Bento span classes based on card index to create a rich asymmetrical layout
  const getBentoSpanClass = (index: number, total: number) => {
    if (total === 1) return 'col-span-1 md:col-span-4 row-span-2';
    if (total === 2) return 'col-span-1 md:col-span-2 row-span-2';

    const idx = index % 5;
    switch (idx) {
      case 0:
        // Hero card (large landscape top left)
        return 'col-span-1 sm:col-span-2 md:col-span-2 row-span-2';
      case 1:
        // Medium top right card
        return 'col-span-1 md:col-span-1 row-span-1';
      case 2:
        // Tall vertical right card
        return 'col-span-1 md:col-span-1 row-span-2';
      case 3:
        // Medium bottom middle card
        return 'col-span-1 md:col-span-1 row-span-1';
      case 4:
        // Bottom wide card
        return 'col-span-1 sm:col-span-2 md:col-span-2 row-span-1';
      default:
        return 'col-span-1 row-span-1';
    }
  };

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
                {galleryItems.length}
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Vidéos, reportages, visuels et ressources de la publication — cliquez pour agrandir
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
          <Sparkles className="w-3.5 h-3.5 text-[#7B61FF]" />
          <span>Lecture automatique en sourdine</span>
        </div>
      </div>

      {/* BENTO GRID CONTAINER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 auto-rows-[160px] sm:auto-rows-[190px]">
        {galleryItems.map((item, index) => {
          const spanClass = getBentoSpanClass(index, galleryItems.length);
          const isVideo = item.type === 'video';
          const isYouTube = item.type === 'youtube';
          const youtubeId = isYouTube ? extractYouTubeId(item.url) : null;

          // Compute YouTube thumbnail if available
          const bgImage =
            item.thumbnail ||
            (isYouTube && youtubeId
              ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
              : item.url || defaultImage);

          return (
            <div
              key={item.id || index}
              onClick={() => handleOpenModal(item)}
              className={`group relative rounded-2xl overflow-hidden bg-gray-900 cursor-pointer border border-gray-800/80 dark:border-gray-800 hover:border-[#7B61FF]/60 transition-all duration-300 shadow-md hover:shadow-2xl ${spanClass}`}
            >
              {/* MEDIA BACKDROP / AUTOPLAY VIDEO */}
              {isVideo ? (
                <div className="absolute inset-0 w-full h-full bg-black overflow-hidden">
                  <video
                    src={item.url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              ) : (
                <div className="absolute inset-0 w-full h-full overflow-hidden bg-gray-900">
                  <img
                    src={bgImage}
                    alt={item.titre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              )}

              {/* GRADIENT OVERLAY FOR TEXT READABILITY */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-85 group-hover:opacity-95 transition-opacity duration-300" />

              {/* TOP BADGES: MEDIA TYPE & DURATION */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-sm">
                  {isYouTube ? (
                    <>
                      <Film className="w-3 h-3 text-red-500 fill-red-500" />
                      <span>YouTube</span>
                    </>
                  ) : isVideo ? (
                    <>
                      <Video className="w-3 h-3 text-[#7B61FF]" />
                      <span>Vidéo</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3 h-3 text-emerald-400" />
                      <span>Image</span>
                    </>
                  )}
                </span>

                {item.duree && (
                  <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-gray-200 text-[10px] font-mono font-semibold">
                    {item.duree}
                  </span>
                )}
              </div>

              {/* CENTER PLAY OVERLAY ICON ON HOVER / FOR VIDEOS & YOUTUBE */}
              {(isVideo || isYouTube) && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-xl ${
                      isYouTube
                        ? 'bg-red-600/90 text-white group-hover:scale-110'
                        : 'bg-white/20 text-white group-hover:scale-110 group-hover:bg-[#7B61FF]/90'
                    }`}
                  >
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>
                </div>
              )}

              {/* BOTTOM CAPTION & METADATA */}
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-10 flex flex-col justify-end">
                <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-[#A89DFF] transition-colors">
                  {item.titre}
                </h3>

                {item.description && (
                  <p className="text-[11px] text-gray-300 line-clamp-1 mt-0.5 hidden sm:block">
                    {item.description}
                  </p>
                )}

                {typeof item.vues === 'number' && (
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1.5">
                    <Eye className="w-3 h-3" />
                    <span>{item.vues} vues</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DETAILED VIEWER */}
      <MediaDetailModal
        media={selectedMedia}
        allMedias={galleryItems}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectMedia={setSelectedMedia}
      />
    </section>
  );
};

export const SujetMediaGallery = NewsMediaGallery;
export type NewsMediaGalleryProps = SujetMediaGalleryProps;

