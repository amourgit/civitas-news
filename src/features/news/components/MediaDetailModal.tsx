import React, { useState, useRef, useEffect } from 'react';
import { SujetMediaItem } from '../../../types/global.types';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Share2,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Video,
  Image as ImageIcon,
  Clock,
  Eye,
  Settings,
  Film,
} from 'lucide-react';
import { toast } from '../../../hooks/useToast';

interface MediaDetailModalProps {
  media: SujetMediaItem | null;
  allMedias: SujetMediaItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia?: (media: SujetMediaItem) => void;
}

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp =
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  media,
  allMedias,
  isOpen,
  onClose,
  onSelectMedia,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset state on media change
  useEffect(() => {
    setIsPlaying(true);
    setCurrentTime(0);
    setImageZoom(1);
    setShowSpeedMenu(false);
  }, [media]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === ' ' && media?.type === 'video' && videoRef.current) {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, media, allMedias]);

  if (!isOpen || !media) return null;

  const currentIndex = allMedias.findIndex((m) => m.id === media.id);
  const hasPrev = allMedias.length > 1;
  const hasNext = allMedias.length > 1;

  const handlePrev = () => {
    if (allMedias.length <= 1) return;
    const prevIndex = (currentIndex - 1 + allMedias.length) % allMedias.length;
    if (onSelectMedia) onSelectMedia(allMedias[prevIndex]);
  };

  const handleNext = () => {
    if (allMedias.length <= 1) return;
    const nextIndex = (currentIndex + 1) % allMedias.length;
    if (onSelectMedia) onSelectMedia(allMedias[nextIndex]);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast('success', 'Lien copié !', 'Le lien du média a été copié dans le presse-papiers.');
    }
  };

  const youtubeId =
    media.type === 'youtube'
      ? extractYouTubeId(media.url) || 'dQw4w9WgXcQ'
      : extractYouTubeId(media.url);

  const isYoutube = media.type === 'youtube' || Boolean(youtubeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      {/* Top Controls Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-white border border-white/10">
            {isYoutube ? (
              <>
                <Film className="w-3.5 h-3.5 text-red-500" />
                <span>YouTube Vidéo</span>
              </>
            ) : media.type === 'video' ? (
              <>
                <Video className="w-3.5 h-3.5 text-[#7B61FF]" />
                <span>Vidéo HD</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Image & Visuel</span>
              </>
            )}
          </span>

          <span className="text-xs text-gray-400">
            {currentIndex + 1} / {allMedias.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Partager"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-red-500 text-white transition-colors"
            title="Fermer (Échap)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Prev Navigation Arrow */}
      {hasPrev && (
        <button
          onClick={handlePrev}
          className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-black/60 hover:bg-white/20 text-white border border-white/10 transition-transform active:scale-95 shadow-xl"
          title="Précédent"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Next Navigation Arrow */}
      {hasNext && (
        <button
          onClick={handleNext}
          className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-black/60 hover:bg-white/20 text-white border border-white/10 transition-transform active:scale-95 shadow-xl"
          title="Suivant"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main Content Container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl"
      >
        {/* MEDIA DISPLAY STAGE */}
        <div className="relative w-full bg-black flex-1 flex items-center justify-center min-h-[300px] sm:min-h-[440px] max-h-[68vh] overflow-hidden">
          {/* YOUTUBE IFRAME EMBED */}
          {isYoutube && youtubeId ? (
            <div className="w-full h-full aspect-video">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={media.titre}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          ) : media.type === 'video' ? (
            /* NATIVE VIDEO PLAYER WITH RICH CONTROLS */
            <div className="relative w-full h-full flex flex-col items-center justify-center group">
              <video
                ref={videoRef}
                src={media.url}
                autoPlay
                playsInline
                onTimeUpdate={() => {
                  if (videoRef.current) {
                    setCurrentTime(videoRef.current.currentTime);
                  }
                }}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    setDuration(videoRef.current.duration);
                    videoRef.current.play().catch(() => {});
                  }
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={togglePlay}
                className="max-h-full max-w-full object-contain cursor-pointer"
              />

              {/* Video Player Bottom Controls Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity opacity-100 sm:opacity-0 group-hover:opacity-100 flex flex-col gap-2">
                {/* Seek Bar */}
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#7B61FF]"
                />

                <div className="flex items-center justify-between text-white text-xs">
                  {/* Left Controls: Play/Pause & Volume */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 fill-white" />
                      ) : (
                        <Play className="w-5 h-5 fill-white" />
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={toggleMute}
                        className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-4 h-4 text-red-400" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 sm:w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[#7B61FF]"
                      />
                    </div>

                    <span className="text-gray-300 font-mono text-[11px]">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  {/* Right Controls: Speed & Fullscreen */}
                  <div className="flex items-center gap-2 relative">
                    <div className="relative">
                      <button
                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-semibold"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>{playbackRate}x</span>
                      </button>

                      {showSpeedMenu && (
                        <div className="absolute bottom-8 right-0 bg-gray-900 border border-gray-700 rounded-lg p-1.5 shadow-2xl flex flex-col gap-1 min-w-[70px]">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => handleSpeedChange(rate)}
                              className={`text-left px-2.5 py-1 rounded text-xs transition-colors ${
                                playbackRate === rate
                                  ? 'bg-[#7B61FF] text-white font-bold'
                                  : 'hover:bg-gray-800 text-gray-300'
                              }`}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={toggleFullscreen}
                      className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                      title="Plein écran"
                    >
                      {isFullscreen ? (
                        <Minimize2 className="w-4 h-4" />
                      ) : (
                        <Maximize2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* IMAGE VIEWER WITH ZOOM CONTROLS */
            <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
              <img
                src={media.url}
                alt={media.titre}
                style={{
                  transform: `scale(${imageZoom})`,
                  transition: 'transform 0.2s ease-out',
                }}
                className="max-h-full max-w-full object-contain select-none"
              />

              {/* Floating Image Zoom Controls */}
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm border border-white/10 p-1.5 rounded-full shadow-lg">
                <button
                  onClick={() => setImageZoom((prev) => Math.max(0.5, prev - 0.25))}
                  className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors"
                  title="Zoom arrière"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-gray-300 px-1">
                  {Math.round(imageZoom * 100)}%
                </span>
                <button
                  onClick={() => setImageZoom((prev) => Math.min(3, prev + 0.25))}
                  className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors"
                  title="Zoom avant"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setImageZoom(1)}
                  className="p-1.5 hover:bg-white/20 rounded-full text-white transition-colors"
                  title="Réinitialiser zoom"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM METADATA & ACTIONS PANEL */}
        <div className="p-4 sm:p-6 bg-gray-900 border-t border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <h3 className="text-base sm:text-lg font-bold text-white font-display">
              {media.titre}
            </h3>
            {media.description && (
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-3xl">
                {media.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
              {media.date && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{media.date}</span>
                </span>
              )}
              {typeof media.vues === 'number' && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{media.vues} vues</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {isYoutube && youtubeId && (
              <a
                href={`https://www.youtube.com/watch?v=${youtubeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors"
              >
                <span>Ouvrir sur YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-colors border border-gray-700"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Partager</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
