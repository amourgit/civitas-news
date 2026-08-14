import { useState, useEffect } from 'react';
import { Commentaire } from '../../../types/global.types';
import { commentsService } from '../../../services/api/comments.service';
import { toast } from '../../../hooks/useToast';
import { ApiError } from '../../../services/api/errors';

function toastEchec(messageParDefaut: string, error: unknown) {
  toast('error', error instanceof ApiError ? error.message : messageParDefaut);
}

export function useComments(sujetId: string, tri: 'recents' | 'populaires' | 'pertinents' = 'recents') {
  const [comments, setComments] = useState<Commentaire[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchComments = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await commentsService.getCommentsBySujet(sujetId, tri);
      setComments(data);
    } catch (e) {
      console.error('Failed to fetch comments', e);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sujetId) fetchComments(true);
  }, [sujetId, tri]);

  /**
   * Requête réelle vers le backend puis rafraîchissement automatique de
   * la liste -- AUCUN rechargement de page requis. En cas d'échec (ex:
   * backend indisponible), on resynchronise quand même avec le serveur
   * pour ne jamais laisser un commentaire fantôme, PUIS on relance
   * l'erreur : CommentComposer (voir handleSubmit) s'en sert pour NE
   * PAS effacer le texte déjà saisi par l'utilisateur, afin qu'il ne
   * perde pas son message et puisse simplement réessayer.
   */
  const addComment = async (contenu: string, auteur: Commentaire['auteur'], reponseA?: string) => {
    try {
      const created = await commentsService.addComment(sujetId, contenu, auteur, reponseA);
      await fetchComments(false);
      return created;
    } catch (error) {
      await fetchComments(false);
      toastEchec("Impossible d'envoyer le commentaire. Réessayez.", error);
      throw error;
    }
  };

  const voteComment = async (commentId: string, direction: 'up' | 'down') => {
    // Mise à jour optimiste immédiate (avant la réponse du backend) --
    // vote perçu comme instantané. Si l'appel échoue ci-dessous, le
    // fetchComments(false) du catch resynchronise avec la vraie valeur
    // serveur : jamais de dérive silencieuse entre l'UI et le backend.
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const isSame = c.userVoteStatus === direction;
          const diff = isSame ? (direction === 'up' ? -1 : 1) : direction === 'up' ? 1 : -1;
          return {
            ...c,
            votes: c.votes + diff,
            userVoteStatus: isSame ? null : direction,
          };
        }
        return c;
      })
    );
    try {
      await commentsService.voteComment(commentId, direction);
      await fetchComments(false);
    } catch (error) {
      await fetchComments(false);
      toastEchec("Le vote n'a pas pu être enregistré.", error);
    }
  };

  const reactComment = async (commentId: string, reaction: any) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const reactionsMap = { ...(c.reactions || {}) };
          const userReactions = [...(c.userReactions || [])];
          const idx = userReactions.indexOf(reaction);

          if (idx > -1) {
            userReactions.splice(idx, 1);
            reactionsMap[reaction] = Math.max(0, (reactionsMap[reaction] || 1) - 1);
            if (reactionsMap[reaction] <= 0) delete reactionsMap[reaction];
          } else {
            userReactions.push(reaction);
            reactionsMap[reaction] = (reactionsMap[reaction] || 0) + 1;
          }

          return {
            ...c,
            reactions: reactionsMap,
            userReactions,
          };
        }
        return c;
      })
    );

    try {
      await commentsService.reactToComment(commentId, reaction);
      await fetchComments(false);
    } catch (error) {
      await fetchComments(false);
      toastEchec("La réaction n'a pas pu être enregistrée.", error);
    }
  };

  const togglePin = async (commentId: string) => {
    try {
      await commentsService.togglePin(commentId);
      await fetchComments(false);
    } catch (error) {
      await fetchComments(false);
      toastEchec("Impossible d'épingler ce commentaire.", error);
    }
  };

  return {
    comments,
    isLoading,
    addComment,
    voteComment,
    reactComment,
    togglePin,
    refetch: (showLoading = false) => fetchComments(showLoading),
  };
}
