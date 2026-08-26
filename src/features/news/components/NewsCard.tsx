import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { News, Sujet } from '../../../types/global.types';
import { Badge } from '../../../components/ui/Badge';
import { RichTextViewer } from '../../../components/ui/RichTextViewer';
import { ExpandableDescription } from '../../../components/ui/ExpandableDescription';
import { TikTokHeartButton } from '../../../components/ui/TikTokHeartButton';
import { useNewsReactions } from '../hooks/useNewsReactions';
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
} from 'lucide-react';

export interface NewsCardProps {
  news?: News;
  sujet?: News;
  onUpdate?: (updated: News) => void;
  onOpenDetail?: (slug: string) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ news, sujet, onUpdate, onOpenDetail }) => {
  const newsItem = news || sujet!;
  const { react } = useNewsReactions(newsItem.id, onUpdate);

  const totalReactions = Object.values(newsItem.stats.reactions || {}).reduce(
    (acc: number, curr: number) => acc + (Number(curr) || 0),
    0
  );

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation when clicking on interactive elements
    if ((e.target as HTMLElement).closest('button') || 
        (e.target as HTMLElement).closest('a') ||
        (e.target as HTMLElement).closest('[data-no-card-click]')) {
      return;
    }
    
    if (onOpenDetail) {
      onOpenDetail(newsItem.slug);
    } else {
      // Fallback to Link navigation if no callback provided
      window.location.href = `/news/${newsItem.slug}`;
    }
  };

  // Main poll & top choice calculation
  const sondagePrincipal = newsItem.sondages && newsItem.sondages.length > 0 ? newsItem.sondages[0] : null;
  const topChoix =
    sondagePrincipal && sondagePrincipal.choix && sondagePrincipal.choix.length > 0
      ? [...sondagePrincipal.choix].sort((a, b) => (b.pourcentage || 0) - (a.pourcentage || 0))[0]
      : null;

  // Medias calculation (max 3 items, image/video support)
  const allMedias = [newsItem.image, ...(newsItem.galerie || [])].filter(Boolean);
  const displayMedias = allMedias.slice(0, 3);
  const extraMediasCount = Math.max(0, allMedias.length - 3);

  return (
    <div 
      className="w-full bg-white dark:bg-[#1A1F4D] rounded-none shadow-sm transition-all duration-200 overflow-hidden mb-2 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* 1. Header Metadata Strip */}
      <div className="bg-gray-50 dark:bg-[#14183E] px-2 sm:px-3 py-1 flex flex-wrap items-center justify-between gap-1.5 text-[11px] sm:text-xs md:text-sm">
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
      <div className="p-2.5 sm:p-3 flex flex-col gap-3 items-stretch justify-between">
        {/* Main Column (Title, Description, Tags, Author info, AND Media thumbnails stacked vertically) */}
        <div className="flex-1 flex flex-col justify-between space-y-2 min-w-0">
          <div className="space-y-1.5">
            {/* Title */}
            <Link to={`/news/${newsItem.slug}`} data-no-card-click>
              <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-gray-900 dark:text-white font-display hover:text-[#5B4DFF] transition-colors leading-tight line-clamp-2">
                {newsItem.titre}
              </h3>
            </Link>

            {/* Description */}
            <ExpandableDescription content={newsItem.description} maxChars={130} />

            {/* Tags */}
            {newsItem.tags && newsItem.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {newsItem.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="text-[9px] sm:text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded-none">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Media preview strip */}
          <div className={`grid gap-1.5 pt-2 w-full ${
            displayMedias.length === 1
              ? 'grid-cols-1'
              : displayMedias.length === 2
              ? 'grid-cols-2'
              : 'grid-cols-3'
          }`}>
            {displayMedias.map((mediaUrl, idx) => {
              const isVideo = mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm') || mediaUrl.includes('video');
              const isLastWithMore = idx === 2 && extraMediasCount > 0;
              return (
                <div
                  key={idx}
                  className="relative h-[50vh] w-full bg-slate-900 overflow-hidden group"
                >
                  {isVideo ? (
                    <video
                      src={mediaUrl}
                      className="w-full h-full object-cover opacity-90"
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt={`${newsItem.titre} ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

                  {/* Video badge if video */}
                  {isVideo && (
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] px-1 py-0.5 font-bold">
                      VIDÉO
                    </div>
                  )}

                  {/* Overflow badge "+N..." on 3rd item if more medias exist */}
                  {isLastWithMore && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px] flex items-center justify-center text-white font-extrabold text-xs sm:text-sm">
                      +{extraMediasCount}...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-4 gap-1 text-center">
          <div className="p-0.5 bg-white dark:bg-[#1A1F4D]">
            <div className="text-[10px] sm:text-xs md:text-sm font-extrabold text-gray-900 dark:text-white font-display">
              {formatNumber(newsItem.stats.votes)}
            </div>
            <div className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-400 uppercase font-semibold">Votes</div>
          </div>

          <div className="p-0.5 bg-white dark:bg-[#1A1F4D]">
            <div className="text-[10px] sm:text-xs md:text-sm font-extrabold text-gray-900 dark:text-white font-display">
              {formatNumber(newsItem.stats.commentaires)}
            </div>
            <div className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-400 uppercase font-semibold">Avis</div>
          </div>

          <div className="p-0.5 bg-white dark:bg-[#1A1F4D]">
            <div className="text-[10px] sm:text-xs md:text-sm font-extrabold text-gray-900 dark:text-white font-display">
              {formatNumber(newsItem.stats.vues)}
            </div>
            <div className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-400 uppercase font-semibold">Vues</div>
          </div>

          <div className="p-0.5 bg-white dark:bg-[#1A1F4D]">
            <div className="text-[10px] sm:text-xs md:text-sm font-extrabold text-[#5B4DFF] font-display">
              {totalReactions}
            </div>
            <div className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-400 uppercase font-semibold">Réact</div>
          </div>
        </div>
      </div>

      {/* 3. Action Toolbar Footer */}
      <div className="bg-gray-50 dark:bg-[#14183E] px-2 sm:px-3 py-1 flex items-center justify-between text-xs sm:text-sm md:text-base">
        <div className="flex items-center gap-3" data-no-card-click>
          <TikTokHeartButton
            newsId={newsItem.id}
            initialCount={newsItem.stats?.reactions?.coeur || 0}
            userReaction={newsItem.userReaction}
            onUpdate={onUpdate}
          />

          <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium hidden sm:inline">
            <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 inline mr-1 text-[#5B4DFF]" />
            {newsItem.stats.commentaires} retours modérés
          </span>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenDetail) {
              onOpenDetail(newsItem.slug);
            }
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-none bg-[#5B4DFF] hover:bg-[#4a3ecc] text-white text-[11px] sm:text-xs md:text-sm font-extrabold transition-colors"
        >
          <span>Explorer la News</span>
          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
        </button>
      </div>
    </div>
  );
};

export const SujetCard = NewsCard;
export type SujetCardProps = NewsCardProps;


