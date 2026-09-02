import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useComments } from '../../discussion/hooks/useComments';
import { CommentNode } from '../../discussion/components/CommentNode';
import { CommentComposer } from '../../discussion/components/CommentComposer';
import { Commentaire } from '../../../types/global.types';
import { useAuthStore } from '../../../store/auth.store';
import { MessageSquare } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';

export interface NewsCardCommentsDrawerProps {
  newsId: string;
}

/**
 * Tiroir "trappe" de commentaires directement sur la card (voir
 * NewsCard.tsx) : contenu positionné en absolute par l'appelant (100%
 * largeur, 90% hauteur de la card, slide bas -> haut à l'ouverture).
 * Deux sous-composants :
 * - Liste défilante (réutilise CommentNode, donc le même rendu que la
 *   page détails -- votes, réactions, fils imbriqués).
 * - Composer STATIQUE unique en bas (réutilise CommentComposer, qui a
 *   déjà nativement le petit cadre "Réponse à @..." au-dessus de lui
 *   dès qu'on lui passe replyToName).
 *
 * Contrairement à CommentThread.tsx (page détails), où chaque
 * commentaire affiche son propre composer de réponse inline, ici
 * replyTargetId est TOUJOURS null côté CommentNode : "répondre" sur
 * n'importe quel commentaire alimente seulement replyTarget (état local
 * à ce tiroir), qui pilote le seul et même composer, fixe en bas.
 */
export function NewsCardCommentsDrawer({ newsId }: NewsCardCommentsDrawerProps) {
  const [replyTarget, setReplyTarget] = useState<Commentaire | null>(null);
  const { comments, isLoading, addComment, voteComment, reactComment, togglePin } = useComments(newsId, 'recents');
  const { user, isAdmin } = useAuthStore();

  const handleSubmit = async (text: string) => {
    if (!user) return;
    await addComment(text, user as Commentaire['auteur'], replyTarget?.id);
    setReplyTarget(null);
  };

  const topLevelComments = comments.filter((c) => !c.reponseA);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="shrink-0 flex items-center gap-1.5 px-4 pt-3 pb-2 text-white/90">
        <MessageSquare className="w-4 h-4" />
        <span className="text-sm font-extrabold font-display">Commentaires ({comments.length})</span>
      </div>

      {/* Sous-composant 1 : liste défilante */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-2">
        {isLoading ? (
          <div className="text-center py-8 text-xs text-white/60">Chargement des interventions...</div>
        ) : !comments.length ? (
          <EmptyState
            icon={<MessageSquare className="w-8 h-8" />}
            title="Aucun commentaire pour le moment"
            description="Soyez la première personne à exprimer votre avis."
          />
        ) : (
          <div className="space-y-3">
            {topLevelComments.map((parent) => (
              <CommentNode
                key={parent.id}
                comment={parent}
                allComments={comments}
                onReply={setReplyTarget}
                onVote={voteComment}
                onReact={reactComment}
                onTogglePin={togglePin}
                canPin={isAdmin}
                depth={0}
                replyTargetId={null}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sous-composant 2 : composer statique, avec son propre cadre
          "Réponse à @..." natif dès qu'un replyTarget est défini. */}
      <div className="shrink-0 px-3 pb-3 pt-2 border-t border-white/10" data-no-card-click>
        <CommentComposer
          onSubmit={handleSubmit}
          replyToName={replyTarget?.auteur.nomAffiche}
          onCancelReply={() => setReplyTarget(null)}
          placeholder="Écrire un commentaire..."
        />
      </div>
    </div>
  );
}
