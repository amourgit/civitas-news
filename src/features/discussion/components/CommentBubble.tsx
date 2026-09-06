import React, { useState } from 'react';
import { Commentaire, TypeReaction } from '../../../types/global.types';
import { Avatar } from '../../../components/ui/Avatar';
import { RichTextViewer } from '../../../components/ui/RichTextViewer';
import { formatDateRelative } from '../../../lib/formatDate';
import { WhatsAppEmojiModal } from '../../../components/ui/WhatsAppEmojiModal';
import { motion, AnimatePresence } from 'motion/react';
import {
  Smile,
  Plus,
  MessageSquare,
  Share2,
  Pin,
  CheckCircle2,
  ShieldCheck,
  Check,
  Play,
  Pause,
  Mic,
} from 'lucide-react';

export interface CommentBubbleProps {
  comment: Commentaire;
  onReply?: (comment: Commentaire) => void;
  onVote?: (commentId: string, direction: 'up' | 'down') => void;
  onReact?: (commentId: string, reaction: TypeReaction | string) => void;
  onTogglePin?: (commentId: string) => void;
  canPin?: boolean;
  parentAuthorName?: string;
  isReplying?: boolean;
}

const QUICK_EMOJIS = [
  { symbol: '👍', name: "J'aime" },
  { symbol: '❤️', name: 'Cœur' },
  { symbol: '👏', name: 'Bravo' },
  { symbol: '🎉', name: 'Youpi' },
  { symbol: '😮', name: 'Wow' },
];

/**
 * WhatsApp Voice Note Audio Player
 */
const AudioCommentPlayer: React.FC<{ duration?: number; audioUrl?: string }> = ({
  duration = 20,
  audioUrl,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
    } else {
      setIsPlaying(true);
      if (!audioRef.current && audioUrl) {
        audioRef.current = new Audio(audioUrl);
      }
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  React.useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const progressPercent = Math.min(100, (currentTime / duration) * 100);

  // Generate bar heights deterministically for consistent waveform shape
  const waveHeights = [10, 16, 22, 14, 8, 18, 24, 12, 16, 20, 10, 14, 22, 18, 12, 24, 16, 10, 18, 14, 20, 12, 8, 16, 22, 14, 10, 18];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="my-1 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-[#121638] border border-gray-200/80 dark:border-gray-700/80 max-w-[220px] sm:max-w-sm flex items-center gap-2 shadow-xs"
    >
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={handleTogglePlay}
        className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-[#00A884] hover:bg-[#008f6f] text-white flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95 cursor-pointer"
        title={isPlaying ? 'Pause' : 'Écouter le vocal'}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
        ) : (
          <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform & Timer */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-0.5 h-5 sm:h-6 w-full overflow-hidden py-1">
          {waveHeights.map((h, i) => {
            const isPlayed = (i / waveHeights.length) * 100 <= progressPercent;
            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-all duration-150 ${
                  isPlayed ? 'bg-[#00A884]' : 'bg-gray-300 dark:bg-gray-600'
                } ${isPlaying ? 'animate-pulse' : ''}`}
                style={{
                  height: `${h}px`,
                  animationDelay: `${(i % 4) * 0.1}s`,
                }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-mono font-medium">
          <span className="flex items-center gap-1">
            <Mic className="w-3 h-3 text-[#00A884]" />
            <span>{isPlaying ? formatTime(currentTime) : formatTime(duration)}</span>
          </span>
          <span className="text-[10px] text-gray-400 font-sans">Message vocal</span>
        </div>
      </div>
    </div>
  );
};

export const CommentBubble: React.FC<CommentBubbleProps> = ({
  comment,
  onReply,
  onReact,
  onTogglePin,
  canPin = false,
  parentAuthorName,
  isReplying = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQuickPicker, setShowQuickPicker] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Active user reactions directly from comment model
  const userReactions = comment.userReactions || [];
  const activeReactions = Object.entries(comment.reactions || {}).filter(([, count]) => count > 0);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectEmoji = (emojiSymbol: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowQuickPicker(false);
    if (onReact) {
      onReact(comment.id, emojiSymbol);
    }
  };

  const isAudioComment =
    comment.typeContenu === 'audio' ||
    Boolean(comment.audioUrl) ||
    (comment.contenu && comment.contenu.includes('🎙️ Message vocal'));

  return (
    <div className="relative group flex items-start gap-1.5 sm:gap-2 py-1 bg-transparent">
      {/* Avatar */}
      <Avatar
        src={comment.auteur.avatar}
        name={comment.auteur.nomAffiche}
        size="sm"
        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full shrink-0 mt-0.5 ring-1 ring-purple-100 dark:ring-purple-900/40"
      />

      <div className="flex-1 min-w-0">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap leading-tight">
          <div className="flex items-center gap-1.5 flex-wrap text-xs sm:text-sm">
            <span className="font-extrabold text-[#0079D3] dark:text-sky-400 hover:underline cursor-pointer">
              {comment.auteur.nomAffiche}
            </span>

            {/* Parent author name */}
            {parentAuthorName && (
              <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400 font-semibold text-xs">
                <span className="text-gray-400 dark:text-gray-500 font-normal">→</span>
                <span>{parentAuthorName}</span>
              </span>
            )}

            {/* Timestamp */}
            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-normal">
              • {formatDateRelative(comment.createdAt)}
            </span>

            {/* Badges */}
            {comment.estAdministrateur && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#5B4DFF] text-white text-[9px] font-extrabold uppercase tracking-wider">
                <ShieldCheck className="w-2.5 h-2.5" />
                Officiel
              </span>
            )}
            {comment.estEpingle && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-[9px] font-bold">
                <Pin className="w-2.5 h-2.5" /> Épinglé
              </span>
            )}
            {comment.estReponseAcceptee && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold">
                <CheckCircle2 className="w-2.5 h-2.5" /> Réponse Validée
              </span>
            )}
          </div>
        </div>

        {/* Comment Body - Text or Voice Audio Note */}
        {isAudioComment ? (
          <AudioCommentPlayer
            duration={comment.audioDuration || 20}
            audioUrl={comment.audioUrl}
          />
        ) : (
          <div className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-normal mt-0.5 mb-1">
            <RichTextViewer content={comment.contenu} compact />
          </div>
        )}

        {/* Active Reaction Badges on Comment */}
        {activeReactions.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-1">
            {activeReactions.map(([emoji, count]) => {
              const isUserReacted = userReactions.includes(emoji);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={(e) => handleSelectEmoji(emoji, e)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-extrabold transition-all border cursor-pointer ${
                    isUserReacted
                      ? 'bg-purple-100 dark:bg-purple-900/60 border-[#5B4DFF] text-[#5B4DFF] dark:text-sky-300 scale-105'
                      : 'bg-gray-100 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  title={`Réagir avec ${emoji}`}
                >
                  <span>{emoji}</span>
                  <span className="text-[11px]">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Action Bar: Animated Emoji Button · Reply · Share */}
        <div className="flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 font-semibold pt-0.5 relative">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Emoji Reaction Button with Animated Floating Popup */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQuickPicker(!showQuickPicker);
                }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                  userReactions.length > 0
                    ? 'bg-purple-100 dark:bg-purple-950/80 text-[#5B4DFF] dark:text-sky-300 border border-[#5B4DFF]/30'
                    : 'bg-gray-100/80 dark:bg-gray-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-gray-700 dark:text-gray-300 hover:text-[#5B4DFF] border border-gray-200/80 dark:border-gray-700/60'
                }`}
                title="Ajouter une réaction"
              >
                <Smile className={`w-3.5 h-3.5 ${userReactions.length > 0 ? 'text-[#5B4DFF] dark:text-sky-300' : 'text-amber-500'}`} />
                <span>{userReactions.length > 0 ? userReactions[userReactions.length - 1] : 'Réagir'}</span>
              </button>

              {/* Animated Floating Quick Bar (5 most common emojis + "Voir plus") */}
              <AnimatePresence>
                {showQuickPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                    className="absolute bottom-full left-0 mb-2 z-30 flex items-center gap-1 bg-white dark:bg-[#121638] border border-gray-200 dark:border-gray-700 shadow-xl rounded-full px-2 py-1 backdrop-blur-md"
                  >
                    {QUICK_EMOJIS.map((item) => (
                      <button
                        key={item.symbol}
                        type="button"
                        onClick={(e) => handleSelectEmoji(item.symbol, e)}
                        className="p-1 text-lg hover:scale-125 transition-transform active:scale-95 cursor-pointer"
                        title={item.name}
                      >
                        {item.symbol}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQuickPicker(false);
                        setShowWhatsAppModal(true);
                      }}
                      className="p-1 px-1.5 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded-full text-[11px] font-black text-[#5B4DFF] dark:text-sky-400 flex items-center gap-0.5 transition-colors cursor-pointer"
                      title="Voir plus d'emojis WhatsApp"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="whitespace-nowrap">Voir plus</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reply Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReply && onReply(comment);
              }}
              className={`inline-flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
                isReplying
                  ? 'text-[#5B4DFF] dark:text-sky-400 font-bold'
                  : 'hover:text-[#0079D3] dark:hover:text-sky-400 text-gray-500 dark:text-gray-400'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isReplying ? 'Annuler' : 'Répondre'}</span>
            </button>

            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1 hover:text-[#0079D3] dark:hover:text-sky-400 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copié !</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Partager</span>
                </>
              )}
            </button>
          </div>

          {/* Admin Controls */}
          {canPin && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin && onTogglePin(comment.id);
                }}
                className="p-1 rounded hover:text-amber-500 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                title="Épingler ce commentaire"
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Emoji Modal */}
      <WhatsAppEmojiModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        onSelectEmoji={(emoji) => handleSelectEmoji(emoji)}
        selectedEmoji={userReactions[userReactions.length - 1] || null}
      />
    </div>
  );
};



