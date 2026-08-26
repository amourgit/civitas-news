import React from 'react';
import { News, Sujet } from '../../../types/global.types';
import { Badge } from '../../../components/ui/Badge';
import { RichTextViewer } from '../../../components/ui/RichTextViewer';
import { ExpandableDescription } from '../../../components/ui/ExpandableDescription';
import { TikTokHeartButton } from '../../../components/ui/TikTokHeartButton';
import { useNewsReactions } from '../hooks/useNewsReactions';
import { useOpenNewsDetail } from '../hooks/useOpenNewsDetail';
import { formatDateRelative } from '../../../lib/formatDate';
import { formatNumber } from '../../../lib/formatNumber';
import {
  MessageSquare,
  CheckSquare,
  Heart,
  MapPin,
  Eye,
  TrendingUp,
  BarChart2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Images,
} from 'lucide-react';

export interface NewsCardProps {
  news?: News;
  sujet?: News;
  onUpdate?: (updated: News) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ news, sujet, onUpdate }) => {
  const newsItem = news || sujet!;
  const { react } = useNewsReactions(newsItem.id, onUpdate);
  const openNewsDetail = useOpenNewsDetail();

  const totalReactions = Object.values(newsItem.stats.reactions || {}).reduce(
    (acc: number, curr: number) => acc + (Number(curr) || 0),
    0
  );

  // Main poll & top choice calculation
  const sondagePrincipal = newsItem.sondages && newsItem.sondages.length > 0 ? newsItem.sondages[0] : null;
  const topChoix =
    sondagePrincipal && sondagePrincipal.choix && sondagePrincipal.choix.length > 0
      ? [...sondagePrincipal.choix].sort((a, b) => (b.pourcentage || 0) - (a.pourcentage || 0))[0]
      : null;

  // Medias : une seule image héro (80vh), les suivantes ne sont indiquées
  // que par un badge "+N" -- le détail complet (toute la galerie) reste
  // accessible dans le BottomSheet.
  const allMedias = [newsItem.image, ...(newsItem.galerie || [])].filter(Boolean);
  const heroMedia = allMedias[0];
  const extraMediasCount = Math.max(0, allMedias.length - 1);
  const heroIsVideo = !!heroMedia && (heroMedia.endsWith('.mp4') || heroMedia.endsWith('.webm') || heroMedia.includes('video'));

  const handleOpenDetail = () => openNewsDetail(newsItem.slug);

  return (
    <div
      onClick={handleOpenDetail}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpenDetail();
        }
      }}
      className="w-full bg-white dark:bg-[#1A1F4D] rounded-none shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden mb-2 cursor-pointer"
    >
      {/* Hero media -- 80vh, pleine largeur de la card */}
      {heroMedia && (
        <div className="relative h-[80vh] w-full bg-slate-900 overflow-hidden group">
          {heroIsVideo ? (
            <video src={heroMedia} className="w-full h-full object-cover" muted loop playsInline />
          ) : (
            <img
              src={heroMedia}
              alt={newsItem.titre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

          {heroIsVideo && (
            <div className="absolute top-3 left-3 bg-black/60 text-white text-[10px] px-2 py-1 font-bold">
              VIDÉO
            </div>
          )}

          {extraMediasCount > 0 && (
            <div className="absolute top-3 right-3 bg-black/60 text-white text-[10px] px-2 py-1 font-bold flex items-center gap-1">
              <Images className="w-3 h-3" />+{extraMediasCount}
            </div>
          )}
        </div>
      )}

      {/* 1. Header Metadata Strip */}
      <div className="bg-gray-50 dark:bg-[#14183E] px-2 sm:px-3 py-1 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="type" type={newsItem.type}>
            {newsItem.type.toUpperCase()}
          </Badge>

          <span className="px-1.5 py-0.5 rounded-none bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-[10px]">
            {newsItem.categorie.nom}
          </span>

          {newsItem.province && (
            <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400 font-medium text-[10px]">
              <MapPin className="w-2.5 h-2.5 text-[#5B4DFF]" />
              {newsItem.province}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 font-semibold">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            100% Vérifié
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDateRelative(newsItem.createdAt)}
          </span>
        </div>
      </div>

      {/* 2. Main Body: Flex Parent (Desktop: Row inline with dashboard, Mobile: Stacked vertically) */}
      <div className="p-2.5 sm:p-3 flex flex-col md:flex-row gap-3 items-stretch justify-between">
        {/* Main Column (Title, Description, Tags, Author info) */}
        <div className="flex-1 flex flex-col justify-between space-y-2 min-w-0">
          <div className="space-y-1.5">
            {/* Title -- le clic ouvre les détails via le clic de la card
                (bubbling) ; pas de logique propre à isoler ici. */}
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white font-display hover:text-[#5B4DFF] transition-colors leading-tight line-clamp-2">
              {newsItem.titre}
            </h3>

            {/* Description -- garde sa propre logique de clic (voir
                plus/voir moins) : ne doit PAS ouvrir les détails. */}
            <div onClick={(e) => e.stopPropagation()}>
              <ExpandableDescription content={newsItem.description} maxChars={130} />
            </div>

            {/* Tags */}
            {newsItem.tags && newsItem.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {newsItem.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="text-[9px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded-none">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Minimalist Dashboard & Poll Leader */}
        <div className="w-full md:w-72 lg:w-80 shrink-0 bg-gray-50 dark:bg-[#14183E] p-2 sm:p-2.5 rounded-none flex flex-col justify-between space-y-2">
          {/* Top Choice in Poll if available */}
          {sondagePrincipal && topChoix ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-[#5B4DFF]">
                <span className="flex items-center gap-1 uppercase tracking-wider">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  Tendance Principale
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {topChoix.pourcentage}% ({formatNumber(topChoix.nombreVotes)} v)
                </span>
              </div>
              <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                {topChoix.libelle}
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-none overflow-hidden">
                <div
                  className="bg-[#5B4DFF] h-full transition-all duration-300"
                  style={{ width: `${topChoix.pourcentage}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                <span className="flex items-center gap-1 uppercase tracking-wider">
                  <AlertCircle className="w-3 h-3" />
                  Tableau de Bord News
                </span>
                <span className="text-gray-600 dark:text-gray-400 font-normal">Taux d'engagement</span>
              </div>
              <div className="text-xs font-bold text-gray-900 dark:text-white">
                {formatNumber(newsItem.stats.votes + newsItem.stats.commentaires)} participations citoyennes
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-none overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all duration-300 w-3/4" />
              </div>
            </div>
          )}

          {/* Statistics Grid */}
          <div className="grid grid-cols-4 gap-1 pt-1.5 text-center">
            <div className="p-0.5 bg-white dark:bg-[#1A1F4D]">
              <div className="text-[10px] font-extrabold text-gray-900 dark:text-white font-display">
                {formatNumber(newsItem.stats.votes)}
              </div>
              <div className="text-[8px] text-gray-400 uppercase font-semibold">Votes</div>
            </div>

            <div className="p-0.5 bg-white dark:bg-[#1A1F4D]">
              <div className="text-[10px] font-extrabold text-gray-900 dark:text-white font-display">
                {formatNumber(newsItem.stats.commentaires)}
              </div>
              <div className="text-[8px] text-gray-400 uppercase font-semibold">Avis</div>
            </div>

            <div className="p-0.5 bg-white dark:bg-[#1A1F4D]">
              <div className="text-[10px] font-extrabold text-gray-900 dark:text-white font-display">
                {formatNumber(newsItem.stats.vues)}
              </div>
              <div className="text-[8px] text-gray-400 uppercase font-semibold">Vues</div>
            </div>

            <div className="p-0.5 bg-white dark:bg-[#1A1F4D]">
              <div className="text-[10px] font-extrabold text-[#5B4DFF] font-display">
                {totalReactions}
              </div>
              <div className="text-[8px] text-gray-400 uppercase font-semibold">Réact</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Action Toolbar Footer */}
      <div className="bg-gray-50 dark:bg-[#14183E] px-2 sm:px-3 py-1 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          {/* Garde sa propre logique de réaction : ne doit PAS ouvrir les
              détails au clic. */}
          <div onClick={(e) => e.stopPropagation()}>
            <TikTokHeartButton
              newsId={newsItem.id}
              initialCount={newsItem.stats?.reactions?.coeur || 0}
              userReaction={newsItem.userReaction}
              onUpdate={onUpdate}
            />
          </div>

          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium hidden sm:inline">
            <MessageSquare className="w-3 h-3 inline mr-1 text-[#5B4DFF]" />
            {newsItem.stats.commentaires} retours modérés
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDetail();
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-none bg-[#5B4DFF] hover:bg-[#4a3ecc] text-white text-[11px] font-extrabold transition-colors"
        >
          <span>Explorer la News</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export const SujetCard = NewsCard;
export type SujetCardProps = NewsCardProps;

