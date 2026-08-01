import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../../store/auth.store';
import { Avatar } from '../../../components/ui/Avatar';
import { Send, X } from 'lucide-react';

export interface CommentComposerProps {
  onSubmit: (text: string) => void;
  replyToName?: string;
  onCancelReply?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  compact?: boolean;
}

export const CommentComposer: React.FC<CommentComposerProps> = ({
  onSubmit,
  replyToName,
  onCancelReply,
  autoFocus = false,
  placeholder = "Partagez votre point de vue...",
  compact = false,
}) => {
  const { user } = useAuthStore();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text);
    setText('');
  };

  return (
    <div
      className={`bg-white dark:bg-[#1A1F4D] rounded-none border border-gray-200 dark:border-gray-800 shadow-sm transition-all ${
        compact ? 'p-2 sm:p-2.5 bg-gray-50/50 dark:bg-[#151940]' : 'p-2 sm:p-3'
      }`}
    >
      {replyToName && (
        <div className="flex items-center justify-between text-xs text-[#5B4DFF] dark:text-sky-400 font-bold bg-purple-50/80 dark:bg-purple-950/40 px-2.5 py-1 rounded-none mb-2 border-l-2 border-[#5B4DFF]">
          <span>En réponse à @{replyToName}</span>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="inline-flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors font-semibold"
            >
              <X className="w-3.5 h-3.5" />
              <span>Annuler</span>
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2.5 items-start">
        <Avatar
          src={user.avatar}
          name={user.nomAffiche}
          size={compact ? 'sm' : 'md'}
          className="shrink-0 mt-0.5"
        />

        <div className="flex-1 space-y-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            rows={compact ? 2 : 3}
            className="w-full p-2 rounded-none bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5B4DFF] resize-none"
          />

          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-1 text-gray-400">
              <button
                type="button"
                onClick={() => setText((t) => t + ' 👍')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-sm"
                title="Ajouter 👍"
              >
                👍
              </button>
              <button
                type="button"
                onClick={() => setText((t) => t + ' ❤️')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-sm"
                title="Ajouter ❤️"
              >
                ❤️
              </button>
            </div>

            <div className="flex items-center gap-2">
              {onCancelReply && (
                <button
                  type="button"
                  onClick={onCancelReply}
                  className="px-3 py-1.5 rounded-none border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-semibold transition-colors"
                >
                  Annuler
                </button>
              )}
              <button
                type="submit"
                disabled={!text.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-none bg-[#5B4DFF] hover:bg-[#4E40E5] disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all active:scale-95"
              >
                <span>Publier</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
