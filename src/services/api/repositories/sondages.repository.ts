// ============================================================
// src/services/api/repositories/sondages.repository.ts
// Implémentation RÉELLE du domaine Sondages.
// ============================================================

import { http } from './httpClient';
import { SONDAGES_ENDPOINTS } from '../endpoints';
import { SondageSchema, type Sondage } from '../../../types/global.types';

/**
 * Forme d'ÉCRITURE — le backend (sondages/api/v1/serializers.py:
 * SondageEcritureSerializer) attend `choix` comme un tableau de libellés
 * (string[]), pas les objets ChoixSondage complets renvoyés en lecture.
 * `dateDebut`/`dateFin` sont obligatoires côté backend (pas de valeur par
 * défaut sur le modèle).
 */
export interface SondageEcriturePayload {
  newsId: string;
  titre: string;
  description?: string;
  question: string;
  choix: string[];
  dateDebut: string;
  dateFin: string;
  typeVote?: 'unique' | 'multiple';
  anonymat?: boolean;
  visibiliteResultat?: 'instantane' | 'masque_jusqua_fin';
  statut?: 'actif' | 'programme' | 'termine' | 'archive';
}

export const sondagesRepository = {
  async create(payload: SondageEcriturePayload): Promise<Sondage> {
    const { newsId, ...rest } = payload;
    // POST JSON standard : CamelCaseJSONParser convertit automatiquement
    // les clés (dateDebut -> date_debut, typeVote -> type_vote, ...).
    const response = await http.post.post<Record<string, unknown>, Sondage>({
      endpoint: SONDAGES_ENDPOINTS.create,
      body: { ...rest, news: newsId },
      responseSchema: SondageSchema,
      requireAuth: true,
    });
    return response.data;
  },

  /**
   * Remplace intégralement la sélection courante de l'utilisateur sur ce
   * sondage (backend : sondages/api/v1/services.py:enregistrer_vote) --
   * PAS un simple ajout : les choix absents de `choixIds` mais
   * précédemment votés sont retirés côté serveur. `choixIds: []` retire
   * donc entièrement le vote (voir `retirerVote` ci-dessous, équivalent
   * explicite pour ce cas précis).
   */
  async vote(sondageId: string, choixIds: string[]): Promise<Sondage> {
    const response = await http.post.post<{ choixIds: string[] }, Sondage>({
      endpoint: SONDAGES_ENDPOINTS.vote(sondageId),
      body: { choixIds },
      responseSchema: SondageSchema,
      requireAuth: true,
    });
    return response.data;
  },

  /** Annule intégralement le vote de l'utilisateur sur ce sondage. */
  async retirerVote(sondageId: string): Promise<Sondage> {
    return sondagesRepository.vote(sondageId, []);
  },
};
