import React, { useState } from 'react';
import { Commentaire, TypeReaction } from '../../../types/global.types';
import { Avatar } from '../../../components/ui/Avatar';
import { RichTextViewer } from '../../../components/ui/RichTextViewer';
import { formatDateRelative } from '../../../lib/formatDate';
import {
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Share2,
  Pin,
  CheckCircle2,
  ShieldCheck,
  Check,
} from 'lucide-react';

export interface CommentBubbleProps {
  comment: Commentaire;
  onReply?: (comment: Commentaire) => void;
  onVote?: (commentId: string, direction: 'up' | 'down') => void;
  onReact?: (commentId: string, reaction: TypeReaction) => void;
  onTogglePin?: (commentId: string) => void;
  canPin?: boolean;
  parentAuthorName?: string;
  isReplying?: boolean;
}

export const CommentBubble: React.FC<CommentBubbleProps> = ({
  comment,
  onReply,
  onVote,
  onTogglePin,
  canPin = false,
  parentAuthorName,
  isReplying = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`relative group flex items-start gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-none transition-all ${
        comment.estEpingle
          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-l-4 border-amber-400 dark:border-amber-600'
          : comment.estReponseAcceptee
          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-l-4 border-emerald-400 dark:border-emerald-600'
          : comment.estAdministrateur
          ? 'bg-purple-50/30 dark:bg-purple-950/10 border-l-4 border-[#5B4DFF]'
          : 'bg-white dark:bg-[#1A1F4D] hover:bg-gray-50/50 dark:hover:bg-white/[0.02]'
      }`}
    >
      {/* Disqus-style Avatar on Left */}
      <Avatar
        src={comment.auteur.avatar}
        name={comment.auteur.nomAffiche}
        size="md"
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full shrink-0 mt-0.5"
      />

      <div className="flex-1 min-w-0">
        {/* Top Header: Author Name (in accent blue), Replied-to arrow, Timestamp, Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap leading-tight">
          <div className="flex items-center gap-1.5 flex-wrap text-xs sm:text-sm">
            <span className="font-extrabold text-[#0079D3] dark:text-sky-400 hover:underline cursor-pointer">
              {comment.auteur.nomAffiche}
            </span>

            {/* Replied-to arrow -> ParentAuthorName */}
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

        {/* Comment Body */}
        <div className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-normal mt-1 mb-2">
          <RichTextViewer content={comment.contenu} compact />
        </div>

        {/* Disqus Action Bar: Vote Chevrons · Reply · Share */}
        <div className="flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 font-semibold pt-0.5">
          <div className="flex items-center gap-3">
            {/* Upvote / Downvote Chevrons */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onVote && onVote(comment.id, 'up')}
                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                  comment.userVoteStatus === 'up' ? 'text-[#0079D3] dark:text-sky-400 font-bold' : ''
                }`}
                title="Voter pour"
              >
                <ChevronUp className="w-4 h-4 stroke-[2.5]" />
              </button>
              <span className="min-w-[16px] text-center text-xs font-bold text-gray-700 dark:text-gray-300">
                {comment.votes}
              </span>
              <button
                onClick={() => onVote && onVote(comment.id, 'down')}
                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                  comment.userVoteStatus === 'down' ? 'text-red-500 font-bold' : ''
                }`}
                title="Voter contre"
              >
                <ChevronDown className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <span className="text-gray-300 dark:text-gray-700">·</span>

            {/* Reply Button */}
            <button
              onClick={() => onReply && onReply(comment)}
              className={`inline-flex items-center gap-1 font-semibold transition-colors ${
                isReplying
                  ? 'text-[#5B4DFF] dark:text-sky-400 font-bold'
                  : 'hover:text-[#0079D3] dark:hover:text-sky-400 text-gray-500 dark:text-gray-400'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isReplying ? 'Annuler la réponse' : 'Répondre'}</span>
            </button>

            <span className="text-gray-300 dark:text-gray-700">·</span>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 hover:text-[#0079D3] dark:hover:text-sky-400 transition-colors"
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
                onClick={() => onTogglePin && onTogglePin(comment.id)}
                className="p-1 rounded hover:text-amber-500 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Épingler ce commentaire"
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

