// ============================================================
// src/services/api/repositories/sondages.repository.ts
// Implémentation RÉELLE du domaine Sondages.
// ============================================================

import { http } from './httpClient';
import { SONDAGES_ENDPOINTS } from '../endpoints';
import { SondageSchema, type Sondage } from '../../../types/global.types';

export const sondagesRepository = {
  async vote(sondageId: string, choixIds: string[]): Promise<Sondage> {
    const response = await http.post.post<{ choixIds: string[] }, Sondage>({
      endpoint: SONDAGES_ENDPOINTS.vote(sondageId),
      body: { choixIds },
      responseSchema: SondageSchema,
      requireAuth: true,
    });
    return response.data;
  },
};
