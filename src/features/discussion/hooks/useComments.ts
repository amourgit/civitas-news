import { useState, useEffect } from 'react';
import { Commentaire } from '../../../types/global.types';
import { commentsService } from '../../../services/api/comments.service';

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

  const addComment = async (contenu: string, auteur: Commentaire['auteur'], reponseA?: string) => {
    const created = await commentsService.addComment(sujetId, contenu, auteur, reponseA);
    fetchComments(false);
    return created;
  };

  const voteComment = async (commentId: string, direction: 'up' | 'down') => {
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
    await commentsService.voteComment(commentId, direction);
    fetchComments(false);
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

    await commentsService.reactToComment(commentId, reaction);
    fetchComments(false);
  };

  const togglePin = async (commentId: string) => {
    await commentsService.togglePin(commentId);
    fetchComments(false);
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

