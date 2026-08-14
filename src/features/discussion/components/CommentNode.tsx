import React, { useState, useEffect } from 'react';
import { Commentaire, TypeReaction } from '../../../types/global.types';
import { CommentBubble } from './CommentBubble';
import { CommentComposer } from './CommentComposer';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface CommentNodeProps {
  comment: Commentaire;
  allComments: Commentaire[];
  onReply?: (comment: Commentaire) => void;
  onVote?: (commentId: string, direction: 'up' | 'down') => void;
  onReact?: (commentId: string, reaction: TypeReaction) => void;
  onTogglePin?: (commentId: string) => void;
  canPin?: boolean;
  parentAuthorName?: string;
  depth?: number;
  replyTargetId?: string | null;
  onSubmitReply?: (text: string, parentId: string) => void | Promise<void>;
  onCancelReply?: () => void;
}

export const CommentNode: React.FC<CommentNodeProps> = ({
  comment,
  allComments,
  onReply,
  onVote,
  onReact,
  onTogglePin,
  canPin = false,
  parentAuthorName,
  depth = 0,
  replyTargetId,
  onSubmitReply,
  onCancelReply,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const isReplying = replyTargetId === comment.id;

  useEffect(() => {
    if (isReplying && !isExpanded) {
      setIsExpanded(true);
    }
  }, [isReplying, isExpanded]);

  // Find direct child replies to this comment (can be nested indefinitely!)
  const children = allComments.filter((c) => c.reponseA === comment.id);

  return (
    <div className="space-y-2">
      {/* The Comment Bubble formatted like Disqus */}
      <CommentBubble
        comment={comment}
        onReply={onReply}
        onVote={onVote}
        onReact={onReact}
        onTogglePin={onTogglePin}
        canPin={canPin}
        parentAuthorName={parentAuthorName}
        isReplying={isReplying}
      />

      {/* Inline Reply Composer with Opening Animation and Indentation */}
      <AnimatePresence>
        {isReplying && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -6 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 ml-2.5 sm:ml-8 pl-2 sm:pl-3 border-l-2 border-[#5B4DFF] dark:border-sky-500">
              <CommentComposer
                // Doit RETOURNER la promesse (pas juste l'invoquer) --
                // CommentComposer.handleSubmit fait `await onSubmit(...)`
                // pour savoir si l'envoi a réellement réussi avant
                // d'effacer le champ (voir son implémentation).
                onSubmit={(text) => onSubmitReply?.(text, comment.id)}
                replyToName={comment.auteur.nomAffiche}
                onCancelReply={onCancelReply}
                autoFocus={true}
                placeholder={`Répondre à @${comment.auteur.nomAffiche}...`}
                compact={true}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expand/Collapse toggle button for nested replies */}
      {children.length > 0 && (
        <div className="ml-5 sm:ml-9">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0079D3] dark:text-sky-400 hover:underline py-0.5 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>
                  Masquer {children.length > 1 ? `les ${children.length} réponses` : 'la réponse'}
                </span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>
                  Voir {children.length > 1 ? `les ${children.length} réponses` : 'la réponse'}
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Nested Replies Container with Motion Animation & Flexible Indentation */}
      <AnimatePresence initial={false}>
        {children.length > 0 && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div
              className={`mt-1.5 space-y-2 ${
                depth < 4
                  ? 'ml-2.5 sm:ml-8 pl-2 sm:pl-3 border-l-2 border-gray-200 dark:border-gray-800'
                  : 'ml-1.5 sm:ml-4 pl-1.5 sm:pl-2.5 border-l-2 border-gray-300 dark:border-gray-700'
              }`}
            >
              {children.map((child) => (
                <CommentNode
                  key={child.id}
                  comment={child}
                  allComments={allComments}
                  onReply={onReply}
                  onVote={onVote}
                  onReact={onReact}
                  onTogglePin={onTogglePin}
                  canPin={canPin}
                  parentAuthorName={comment.auteur.nomAffiche}
                  depth={depth + 1}
                  replyTargetId={replyTargetId}
                  onSubmitReply={onSubmitReply}
                  onCancelReply={onCancelReply}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
