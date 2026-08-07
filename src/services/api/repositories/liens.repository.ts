// ============================================================
// src/services/api/repositories/liens.repository.ts
// Implémentation RÉELLE du domaine Liens de publication.
// ============================================================

import { http } from './httpClient';
import { LIENS_ENDPOINTS } from '../endpoints';
import { LienPublicationSchema, type LienPublication, type LienScope } from '../../../types/global.types';
import { paginatedSchema, fetchAllPages } from '../utils/pagination';

/**
 * Forme d'ÉCRITURE — distincte de la forme de LECTURE (`LienPublication`).
 * Le backend (liens/api/v1/serializers.py: LienPublicationEcritureSerializer)
 * attend `mot_de_passe` comme le MOT DE PASSE EN CLAIR (write-only, haché
 * côté serveur), pas un booléen. La lecture, elle, expose `motDePasse`
 * comme un booléen (`a_mot_de_passe`) : "un mot de passe existe-t-il ?".
 * Absent/undefined ici = pas de mot de passe pour ce lien.
 */
export interface LienEcriturePayload {
  urlPublique?: string;
  visibilite: 'public' | 'prive' | 'limite';
  motDePasse?: string;
  expiration?: string;
  usageUnique?: boolean;
  scope?: LienScope;
}

export const liensRepository = {
  async listByNews(newsId: string): Promise<LienPublication[]> {
    return fetchAllPages<LienPublication>(async (page) => {
      const response = await http.get.get({
        endpoint: LIENS_ENDPOINTS.create,
        params: { news: newsId, page },
        schema: paginatedSchema(LienPublicationSchema),
        requireAuth: false,
      });
      return { results: response.data.results, next: response.data.next };
    });
  },

  async generate(newsId: string, payload: LienEcriturePayload): Promise<LienPublication> {
    const response = await http.post.post<LienEcriturePayload & { news: string }, LienPublication>({
      endpoint: LIENS_ENDPOINTS.create,
      // `news` est requis par liens/api/v1/serializers.py
      // (LienPublicationEcritureSerializer) — l'URL n'étant plus
      // imbriquée sous /news/{id}/, l'id doit voyager dans le corps.
      body: { ...payload, news: newsId },
      responseSchema: LienPublicationSchema,
      requireAuth: true,
    });
    return response.data;
  },

  /** POST public (pas d'auth requise) — trace un clic/scan sur le lien. */
  async acceder(id: string, typeAcces: 'clic' | 'scan' = 'clic'): Promise<{ valide: boolean; aMotDePasse: boolean }> {
    const response = await http.post.post<{ typeAcces: 'clic' | 'scan' }, { valide: boolean; aMotDePasse: boolean }>({
      endpoint: LIENS_ENDPOINTS.acceder(id),
      body: { typeAcces },
      requireAuth: false,
    });
    return response.data;
  },
};
