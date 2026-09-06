// ============================================================
// src/services/api/repositories/statistiques.repository.ts
// Implémentation RÉELLE du domaine Statistiques globales.
// ============================================================

import { http } from './httpClient';
import { STATISTIQUES_ENDPOINTS } from '../endpoints';
import { StatistiquesGlobalesSchema, type StatistiquesGlobales } from '../../../types/global.types';
import { toCamelCaseDeep } from '../../../lib/caseConversion';

export const statistiquesRepository = {
  async getGlobales(): Promise<StatistiquesGlobales> {
    const response = await http.get.get<StatistiquesGlobales>({
      endpoint: STATISTIQUES_ENDPOINTS.globales,
      schema: StatistiquesGlobalesSchema,
      // Le backend (statistiques/api/v1/services.py:calculer_statistiques_globales)
      // construit sa réponse à la main plutôt que via un serializer DRF --
      // ses clés arrivent en snake_case (total_visiteurs, participation_par_province...)
      // alors que le schéma Zod attend du camelCase. Sans cette normalisation,
      // la validation échouait sur la quasi-totalité des champs en production.
      transform: (data: unknown) => toCamelCaseDeep(data) as StatistiquesGlobales,
      requireAuth: false,
    });
    return response.data;
  },
};
