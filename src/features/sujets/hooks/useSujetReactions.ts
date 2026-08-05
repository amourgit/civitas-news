import { TypeReaction } from '../../../types/global.types';
import { sujetsService } from '../../../services/api/sujets.service';

export function useSujetReactions(sujetId: string, onUpdate?: (updatedSujet: any) => void) {
  const react = async (reactionType: TypeReaction) => {
    try {
      const updated = await sujetsService.reactToSujet(sujetId, reactionType);
      if (onUpdate) onUpdate(updated);
      return updated;
    } catch (err) {
      console.error('Erreur reaction sujet:', err);
    }
  };

  return { react };
}
