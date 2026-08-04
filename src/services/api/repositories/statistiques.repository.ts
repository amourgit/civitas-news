// ============================================================
// src/services/api/repositories/statistiques.repository.ts
// Implémentation RÉELLE du domaine Statistiques globales.
// ============================================================

import { http } from './httpClient';
import { STATISTIQUES_ENDPOINTS } from '../endpoints';
import { StatistiquesGlobalesSchema, type StatistiquesGlobales } from '../../../types/global.types';

export const statistiquesRepository = {
  async getGlobales(): Promise<StatistiquesGlobales> {
    const response = await http.get.get<StatistiquesGlobales>({
      endpoint: STATISTIQUES_ENDPOINTS.globales,
      schema: StatistiquesGlobalesSchema,
      requireAuth: false,
    });
    return response.data;
  },
};
