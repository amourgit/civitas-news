import { useState } from 'react';
import { sondagesService } from '../../../services/api/sondages.service';
import { toast } from '../../../hooks/useToast';
import type { Sondage } from '../../../types/global.types';

export function useVote(sondageId: string, onVoteSuccess?: (updatedSondage: Sondage) => void) {
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

  /**
   * Retire intégralement le vote de l'utilisateur sur ce sondage.
   * Équivalent à `vote([])` côté backend (voir
   * sondages/api/v1/services.py:retirer_vote) : un utilisateur peut
   * changer d'avis ou annuler son vote tant que le sondage est actif.
   */
  const retirerVote = async () => {
    setIsSubmitting(true);
    try {
      const updated = await sondagesService.voteSondage(sondageId, []);
      toast('success', 'Vote retiré', 'Votre vote a bien été retiré de ce sondage.');
      if (onVoteSuccess && updated) onVoteSuccess(updated);
    } catch (err: any) {
      toast('error', 'Erreur', err?.message || 'Impossible de retirer votre vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { vote, retirerVote, isSubmitting };
}
