import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useComments } from '../../../../discussion/hooks/useComments';
import { Avatar } from '../../../../../components/ui/Avatar';
import { SidebarWidgetCard } from './SidebarWidgetCard';

export interface CommentsPreviewWidgetProps {
  newsId: string;
  onScrollToComments?: () => void;
}

/**
 * Aperçu des derniers commentaires dans la sidebar (esprit du widget
 * "Comments" des maquettes) -- le fil complet, avec réponses et
 * composeur, reste dans la colonne principale (CommentThread) : trop
 * riche pour tenir dans une colonne étroite. Ce widget se contente
 * d'un aperçu qui renvoie vers le fil complet.
 */
export const CommentsPreviewWidget: React.FC<CommentsPreviewWidgetProps> = ({ newsId, onScrollToComments }) => {
  const { comments, isLoading } = useComments(newsId, 'recents');
  const preview = comments.slice(0, 2);

  if (!isLoading && preview.length === 0) return null;

  return (
    <SidebarWidgetCard title="Derniers avis" icon={<MessageCircle className="w-4 h-4" />}>
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-2.5 w-full rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {preview.map((comment) => (
            <button
              key={comment.id}
              type="button"
              onClick={onScrollToComments}
              className="flex items-start gap-2.5 text-left w-full group"
            >
              <Avatar src={comment.auteur.avatar} name={comment.auteur.nomAffiche} size="sm" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#5B4DFF] dark:group-hover:text-sky-300 transition-colors">
                  {comment.auteur.nomAffiche}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                  {comment.contenu}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onScrollToComments}
        className="mt-4 w-full text-center text-xs font-bold text-[#5B4DFF] dark:text-sky-300 hover:underline"
      >
        Voir tous les commentaires
      </button>
    </SidebarWidgetCard>
  );
};
