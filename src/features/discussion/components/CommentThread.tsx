import React, { useState } from 'react';
import { useComments } from '../hooks/useComments';
import { CommentNode } from './CommentNode';
import { CommentComposer } from './CommentComposer';
import { Commentaire } from '../../../types/global.types';
import { useAuthStore } from '../../../store/auth.store';
import { MessageSquare, ArrowUpDown } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';

export interface CommentThreadProps {
  newsId?: string;
  sujetId?: string;
}

export const CommentThread: React.FC<CommentThreadProps> = ({ newsId, sujetId }) => {
  const targetId = newsId || sujetId || '';
  const [tri, setTri] = useState<'recents' | 'populaires' | 'pertinents'>('recents');
  const [replyTarget, setReplyTarget] = useState<Commentaire | null>(null);
  const { comments, isLoading, addComment, voteComment, reactComment, togglePin } = useComments(
    targetId,
    tri
  );
  const { user, isAdmin } = useAuthStore();

  const handleCreateGeneralComment = async (text: string) => {
    // Le toast d'erreur éventuel est déjà géré par useComments.ts --
    // on laisse simplement l'erreur remonter pour que CommentComposer
    // (voir son handleSubmit) sache ne PAS effacer le texte saisi.
    await addComment(text, user, undefined);
  };

  const handleCreateReplyComment = async (text: string, parentId: string) => {
    await addComment(text, user, parentId);
    // Ferme le composer de réponse UNIQUEMENT si l'envoi a réellement
    // réussi (sinon `await` ci-dessus a déjà levé et cette ligne n'est
    // jamais atteinte) -- sans quoi un échec silencieux fermerait quand
    // même la réponse en cours de rédaction.
    setReplyTarget(null);
  };

  const handleToggleReply = (comment: Commentaire) => {
    setReplyTarget((prev) => (prev?.id === comment.id ? null : comment));
  };

  const topLevelComments = comments.filter((c) => !c.reponseA);

  return (
    <div className="space-y-2.5 my-3">
      {/* Thread Header */}
      <div className="flex items-center justify-between border-b pb-2 border-gray-200 dark:border-gray-800">
        <h3 className="text-base font-extrabold text-gray-900 dark:text-white font-display flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-[#5B4DFF]" />
          Fil de Discussion ({comments.length})
        </h3>

        {/* Sort Options */}
        <div className="flex items-center gap-1 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={tri}
            onChange={(e) => setTri(e.target.value as any)}
            className="bg-white dark:bg-[#1A1F4D] border border-gray-200 dark:border-gray-700 rounded-none px-2 py-1 font-semibold text-gray-700 dark:text-gray-200 focus:outline-none text-xs"
          >
            <option value="recents">Plus récents</option>
            <option value="populaires">Plus populaires</option>
            <option value="pertinents">Plus pertinents</option>
          </select>
        </div>
      </div>

      {/* Éditeur de base (pour un commentaire général sans réponse à un commentaire) */}
      <CommentComposer
        onSubmit={handleCreateGeneralComment}
        placeholder="Partagez votre point de vue..."
      />

      {/* List */}
      {isLoading ? (
        <div className="text-center py-8 text-xs text-gray-400">Chargement des interventions...</div>
      ) : !comments.length ? (
        <EmptyState
          icon={<MessageSquare className="w-8 h-8" />}
          title="Aucun commentaire pour le moment"
          description="Soyez la première personne à exprimer votre avis de manière constructive."
        />
      ) : (
        <div className="space-y-2 sm:space-y-2.5">
          {topLevelComments.map((parent) => (
            <CommentNode
              key={parent.id}
              comment={parent}
              allComments={comments}
              onReply={handleToggleReply}
              onVote={voteComment}
              onReact={reactComment}
              onTogglePin={togglePin}
              canPin={isAdmin}
              depth={0}
              replyTargetId={replyTarget?.id || null}
              onSubmitReply={handleCreateReplyComment}
              onCancelReply={() => setReplyTarget(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
