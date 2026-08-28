import { News, TypeReaction } from '../../../types/global.types';
import { newsService } from '../../../services/api/news.service';
import { useRef } from 'react';

interface QueuedReaction {
  reactionType: TypeReaction;
  resolve: (value: News) => void;
  reject: (reason?: unknown) => void;
}

export function useNewsReactions(newsId: string, onUpdate?: (updatedNews: News) => void) {
  const requestQueue = useRef<QueuedReaction[]>([]);
  const isProcessing = useRef(false);

  const processQueue = async () => {
    if (isProcessing.current || requestQueue.current.length === 0) return;
    
    isProcessing.current = true;
    const { reactionType, resolve, reject } = requestQueue.current.shift()!;
    
    try {
      const updated = await newsService.reactToNews(newsId, reactionType);
      if (onUpdate) onUpdate(updated);
      resolve(updated);
    } catch (err) {
      console.error('Erreur reaction news:', err);
      reject(err);
    } finally {
      isProcessing.current = false;
      // Traiter la prochaine requête dans la file
      if (requestQueue.current.length > 0) {
        setTimeout(() => processQueue(), 50); // Petit délai entre les requêtes
      }
    }
  };

  const react = async (reactionType: TypeReaction) => {
    return new Promise((resolve, reject) => {
      // Ajouter la requête à la file d'attente
      requestQueue.current.push({ reactionType, resolve, reject });
      // Démarrer le traitement si pas déjà en cours
      processQueue();
    });
  };

  return { react };
}

export const useSujetReactions = useNewsReactions;

