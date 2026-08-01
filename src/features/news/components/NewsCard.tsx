import React from 'react';
import { Link } from 'react-router-dom';
import { News, Sujet } from '../../../types/global.types';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { RichTextViewer } from '../../../components/ui/RichTextViewer';
import { useNewsReactions } from '../hooks/useNewsReactions';
import { formatDateRelative } from '../../../lib/formatDate';
import { formatNumber } from '../../../lib/formatNumber';
import {
  MessageSquare,
  CheckSquare,
  Heart,
  MapPin,
  Building2,
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
}

export const NewsCard: React.FC<NewsCardProps> = ({ news, sujet, onUpdate }) => {
  const newsItem = news || sujet!;
  const { react } = useNewsReactions(newsItem.id, onUpdate);

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

  // Medias calculation (max 3 items, image/video support)
  const allMedias = [newsItem.image, ...(newsItem.galerie || [])].filter(Boolean);
  const displayMedias = allMedias.slice(0, 3);
  const extraMediasCount = Math.max(0, allMedias.length - 3);

  return (
    <div className="w-full bg-white dark:bg-[#1A1F4D] border border-gray-200 dark:border-gray-800 rounded-none shadow-sm hover:border-[#5B4DFF]/50 transition-all duration-200 overflow-hidden mb-2">
      {/* 1. Header Metadata Strip */}
      <div className="bg-gray-50 dark:bg-[#14183E] px-2 sm:px-3 py-1 border-b border-gray-200 dark:border-gray-800/80 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
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
        {/* Main Column (Title, Description, Tags, Author info, AND Media thumbnails stacked vertically) */}
        <div className="flex-1 flex flex-col justify-between space-y-2 min-w-0">
          <div className="space-y-1.5">
            {/* Author info */}
            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
              <Avatar src={newsItem.auteur.avatar} name={newsItem.auteur.nomAffiche} size="sm" className="w-5 h-5 rounded-full" />
              <span className="font-semibold text-gray-900 dark:text-gray-200 truncate">
                {newsItem.auteur.nomAffiche}
              </span>
              {newsItem.organisation && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-[#5B4DFF] font-medium truncate">
                    <Building2 className="w-3 h-3" />
                    {newsItem.organisation.nom}
                  </span>
                </>
              )}
            </div>

            {/* Title */}
            <Link to={`/news/${newsItem.slug}`}>
              <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white font-display hover:text-[#5B4DFF] transition-colors leading-tight line-clamp-2">
                {newsItem.titre}
              </h3>
            </Link>

            {/* Description */}
            <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-snug">
              <RichTextViewer content={newsItem.description} compact />
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
                  className="relative h-32 sm:h-36 w-full bg-slate-900 overflow-hidden border border-gray-200 dark:border-gray-800 group"
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

        {/* Right Minimalist Dashboard & Poll Leader */}
        <div className="w-full md:w-72 lg:w-80 shrink-0 bg-gray-50 dark:bg-[#14183E] border border-gray-200 dark:border-gray-800/80 p-2 sm:p-2.5 rounded-none flex flex-col justify-between space-y-2">
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
          <div className="grid grid-cols-4 gap-1 pt-1.5 border-t border-gray-200 dark:border-gray-800 text-center">
            <div className="p-0.5 bg-white dark:bg-[#1A1F4D] border border-gray-100 dark:border-gray-800">
              <div className="text-[10px] font-extrabold text-gray-900 dark:text-white font-display">
                {formatNumber(newsItem.stats.votes)}
              </div>
              <div className="text-[8px] text-gray-400 uppercase font-semibold">Votes</div>
            </div>

            <div className="p-0.5 bg-white dark:bg-[#1A1F4D] border border-gray-100 dark:border-gray-800">
              <div className="text-[10px] font-extrabold text-gray-900 dark:text-white font-display">
                {formatNumber(newsItem.stats.commentaires)}
              </div>
              <div className="text-[8px] text-gray-400 uppercase font-semibold">Avis</div>
            </div>

            <div className="p-0.5 bg-white dark:bg-[#1A1F4D] border border-gray-100 dark:border-gray-800">
              <div className="text-[10px] font-extrabold text-gray-900 dark:text-white font-display">
                {formatNumber(newsItem.stats.vues)}
              </div>
              <div className="text-[8px] text-gray-400 uppercase font-semibold">Vues</div>
            </div>

            <div className="p-0.5 bg-white dark:bg-[#1A1F4D] border border-gray-100 dark:border-gray-800">
              <div className="text-[10px] font-extrabold text-[#5B4DFF] font-display">
                {totalReactions}
              </div>
              <div className="text-[8px] text-gray-400 uppercase font-semibold">Réact</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Action Toolbar Footer */}
      <div className="bg-gray-50 dark:bg-[#14183E] px-2 sm:px-3 py-1 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => react('coeur')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] font-bold transition-all ${
              newsItem.userReaction === 'coeur'
                ? 'bg-red-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:text-red-500'
            }`}
          >
            <Heart className={`w-3 h-3 ${newsItem.userReaction === 'coeur' ? 'fill-current' : ''}`} />
            <span>Soutenir ({totalReactions})</span>
          </button>

          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium hidden sm:inline">
            <MessageSquare className="w-3 h-3 inline mr-1 text-[#5B4DFF]" />
            {newsItem.stats.commentaires} retours modérés
          </span>
        </div>

        <Link to={`/news/${newsItem.slug}`}>
          <button className="flex items-center gap-1 px-2.5 py-1 rounded-none bg-[#5B4DFF] hover:bg-[#4a3ecc] text-white text-[11px] font-extrabold transition-colors">
            <span>Explorer la News</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </Link>
      </div>
    </div>
  );
};

export const SujetCard = NewsCard;
export type SujetCardProps = NewsCardProps;


