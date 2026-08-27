import React, { useState, useEffect } from 'react';
import { News, Sujet } from '../../types/global.types';
import { RichTextViewer } from '../../components/ui/RichTextViewer';
import { useOpenNewsDetail } from '../../features/news/hooks/useOpenNewsDetail';
import {
  Play,
  Info,
  ChevronLeft,
  ChevronRight,
  Flame,
  Building2,
  CheckSquare,
  MessageSquare,
  Sparkles,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatNumber } from '../../lib/formatNumber';

export interface NetflixHeroCarouselProps {
  newsList?: News[];
  sujets?: News[];
}

interface SlideBadge {
  label: string;
  color: string;
  icon: React.ReactNode;
}

const SLIDE_BADGES: SlideBadge[] = [
  {
    label: '🔴 URGENT • #TOP 1 EN RDC',
    color: 'bg-red-600 text-white border-red-500',
    icon: <Flame className="w-3.5 h-3.5 text-white animate-pulse" />,
  },
  {
    label: '⭐ PUBLICATION EXCLUSIVE',
    color: 'bg-amber-500 text-black font-black border-amber-400',
    icon: <Award className="w-3.5 h-3.5 text-black" />,
  },
  {
    label: '🔥 TENDANCE NATIONALE',
    color: 'bg-[#5B4DFF] text-white border-indigo-400',
    icon: <Sparkles className="w-3.5 h-3.5 text-yellow-300" />,
  },
  {
    label: '🏛️ DOSSIER STRATÉGIQUE',
    color: 'bg-emerald-600 text-white border-emerald-500',
    icon: <Building2 className="w-3.5 h-3.5 text-white" />,
  },
];

export const NetflixHeroCarousel: React.FC<NetflixHeroCarouselProps> = ({ newsList, sujets }) => {
  const openNewsDetail = useOpenNewsDetail();
  const list = newsList || sujets || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Take up to 4 top items for the featured carousel
  const featured = list.slice(0, 4);

  useEffect(() => {
    if (!featured.length || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % featured.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [featured.length, isPaused]);

  if (!featured.length) return null;

  const current = featured[currentIndex] || featured[0];
  const badge = SLIDE_BADGES[currentIndex % SLIDE_BADGES.length];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + featured.length) % featured.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % featured.length);
  };

  return (
    <div
      className="relative w-full h-[360px] sm:h-[420px] md:h-[480px] bg-slate-950 overflow-hidden select-none group border border-gray-800 shadow-xl mb-3"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image with Cinematic Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img
            src={current.image}
            alt={current.titre}
            className="w-full h-full object-cover object-center opacity-85"
          />
          {/* Netflix Cinematic Vignette & Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent sm:via-slate-950/60" />
          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-slate-950/80 to-transparent pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* Content Layer (Bottom Left) */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-8 md:p-10 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id + '-content'}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl space-y-2 sm:space-y-3"
          >
            {/* Top Tag & Organisation */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] sm:text-xs font-black uppercase tracking-wider border ${badge.color} shadow-sm`}
              >
                {badge.icon}
                <span>{badge.label}</span>
              </span>

              {current.organisation && (
                <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2 py-1 border border-white/20">
                  <Building2 className="w-3 h-3 text-cyan-400" />
                  {current.organisation.nom}
                </span>
              )}
            </div>

            {/* Display Title */}
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black font-display text-white tracking-tight leading-none drop-shadow-lg">
              {current.titre}
            </h1>

            {/* Description */}
            <div className="text-xs sm:text-sm md:text-base text-gray-200 line-clamp-2 md:line-clamp-3 leading-relaxed font-normal drop-shadow">
              <RichTextViewer content={current.description} compact />
            </div>

            {/* Stats Strip */}
            <div className="flex items-center gap-4 text-xs sm:text-sm font-extrabold text-white/90 pt-1">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckSquare className="w-4 h-4" />
                {formatNumber(current.stats.votes)} voix exprimées
              </span>
              <span className="flex items-center gap-1.5 text-purple-300">
                <MessageSquare className="w-4 h-4" />
                {formatNumber(current.stats.commentaires)} avis citoyens
              </span>
            </div>

            {/* Netflix Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2 sm:pt-3">
              <button
                onClick={() => openNewsDetail(current.slug)}
                className="inline-flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 bg-white hover:bg-white/90 text-black font-extrabold text-xs sm:text-sm transition-all shadow-xl active:scale-95"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black text-black" />
                <span>Consulter la News</span>
              </button>

              <button
                onClick={() => openNewsDetail(current.slug)}
                className="inline-flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 bg-gray-500/40 hover:bg-gray-500/60 text-white font-extrabold text-xs sm:text-sm backdrop-blur-md border border-white/30 transition-all active:scale-95"
              >
                <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Plus d&apos;infos</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Netflix Left / Right Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-black/50 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        aria-label="News précédente"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 bg-black/50 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        aria-label="News suivante"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Netflix Slide Indicators (Bottom Right) */}
      <div className="absolute bottom-4 right-4 sm:right-8 flex items-center gap-1.5 z-20">
        {featured.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 transition-all duration-300 ${
              idx === currentIndex
                ? 'w-6 sm:w-8 bg-red-600 shadow-md'
                : 'w-2 sm:w-3 bg-white/40 hover:bg-white/70'
            }`}
            title={`Diapositive ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

