import { useState } from 'react';
import { sondagesService } from '../../../services/sondages.service';
import { toast } from '../../../hooks/useToast';

export function useVote(sondageId: string, onVoteSuccess?: (updatedSondage: any) => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vote = async (choixIds: string[]) => {
    if (!choixIds.length) {
      toast('warning', 'Choix requis', 'Veuillez sélectionner au moins une option.');
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = await sondagesService.voteSondage(sondageId, choixIds);
      toast('success', 'Vote enregistré !', 'Votre avis a été comptabilisé.');
      if (onVoteSuccess && updated) onVoteSuccess(updated);
    } catch (err: any) {
      toast('error', 'Erreur de vote', err?.message || 'Impossible d’enregistrer votre vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { vote, isSubmitting };
}
