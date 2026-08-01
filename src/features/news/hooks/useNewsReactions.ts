import { TypeReaction } from '../../../types/global.types';
import { newsService } from '../../../services/news.service';

export function useNewsReactions(newsId: string, onUpdate?: (updatedNews: any) => void) {
  const react = async (reactionType: TypeReaction) => {
    try {
      const updated = await newsService.reactToNews(newsId, reactionType);
      if (onUpdate) onUpdate(updated);
      return updated;
    } catch (err) {
      console.error('Erreur reaction news:', err);
    }
  };

  return { react };
}

export const useSujetReactions = useNewsReactions;

