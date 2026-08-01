import { useState, useEffect } from 'react';
import { Commentaire } from '../../../types/global.types';
import { commentsService } from '../../../services/comments.service';

export function useComments(sujetId: string, tri: 'recents' | 'populaires' | 'pertinents' = 'recents') {
  const [comments, setComments] = useState<Commentaire[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchComments = async () => {
    setIsLoading(true);
    const data = await commentsService.getCommentsBySujet(sujetId, tri);
    setComments(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (sujetId) fetchComments();
  }, [sujetId, tri]);

  const addComment = async (contenu: string, auteur: Commentaire['auteur'], reponseA?: string) => {
    const created = await commentsService.addComment(sujetId, contenu, auteur, reponseA);
    fetchComments();
    return created;
  };

  const voteComment = async (commentId: string, direction: 'up' | 'down') => {
    await commentsService.voteComment(commentId, direction);
    fetchComments();
  };

  const reactComment = async (commentId: string, reaction: any) => {
    await commentsService.reactToComment(commentId, reaction);
    fetchComments();
  };

  const togglePin = async (commentId: string) => {
    await commentsService.togglePin(commentId);
    fetchComments();
  };

  return {
    comments,
    isLoading,
    addComment,
    voteComment,
    reactComment,
    togglePin,
    refetch: fetchComments,
  };
}
