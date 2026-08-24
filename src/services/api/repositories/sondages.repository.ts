// ============================================================
// src/services/api/repositories/sondages.repository.ts
// Implémentation RÉELLE du domaine Sondages.
// ============================================================

import { http } from './httpClient';
import { SONDAGES_ENDPOINTS } from '../endpoints';
import { SondageSchema, type Sondage } from '../../../types/global.types';
import { paginatedSchema, fetchAllPages } from '../utils/pagination';

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
  async list(newsId?: string): Promise<Sondage[]> {
    return fetchAllPages<Sondage>(async (page) => {
      const response = await http.get.get({
        endpoint: SONDAGES_ENDPOINTS.list,
        params: { page, ...(newsId ? { news: newsId } : {}) },
        schema: paginatedSchema(SondageSchema),
        requireAuth: false,
      });
      return { results: response.data.results, next: response.data.next };
    });
  },

  async getById(id: string): Promise<Sondage> {
    const response = await http.get.get<Sondage>({
      endpoint: SONDAGES_ENDPOINTS.detail(id),
      schema: SondageSchema,
      requireAuth: false,
    });
    return response.data;
  },

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
   * `choix` (les options du sondage) est volontairement TOUJOURS exclu
   * du PATCH : `SondageEcritureSerializer` n'implémente pas de méthode
   * `update()` dédiée (seulement `create()`), le comportement par défaut
   * de DRF ferait alors un `setattr(instance, 'choix', [...])` sur le
   * manager de clé étrangère inverse `Sondage.choix` -- ce qui échoue
   * côté Django (assignation directe interdite sur une relation inverse
   * non nullable). Les options d'un sondage ne sont donc éditables qu'à
   * la création depuis ce backoffice ; le formulaire d'édition les
   * affiche en lecture seule.
   */
  async update(id: string, payload: Partial<Omit<SondageEcriturePayload, 'newsId' | 'choix'>>): Promise<Sondage> {
    const response = await http.update.patch<Record<string, unknown>, Sondage>({
      endpoint: SONDAGES_ENDPOINTS.list,
      resourceId: id,
      patches: payload as Record<string, unknown>,
      responseSchema: SondageSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await http.delete.delete({ endpoint: SONDAGES_ENDPOINTS.list, resourceId: id, requireAuth: true });
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
