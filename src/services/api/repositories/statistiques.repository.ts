// ============================================================
// src/services/api/repositories/statistiques.repository.ts
// Implémentation RÉELLE du domaine Statistiques globales.
// ============================================================

import { http } from './httpClient';
import { STATISTIQUES_ENDPOINTS } from '../endpoints';
import {
  StatistiquesGlobalesSchema,
  type StatistiquesGlobales,
  MesStatistiquesSchema,
  type MesStatistiques,
} from '../../../types/global.types';
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

  /** Statistiques personnelles de l'utilisateur connecté (page Profil) --
   * voir statistiques/api/v1/views.py:MesStatistiquesView côté backend.
   * Nécessite une authentification (IsAuthenticated côté backend). */
  async getMoi(): Promise<MesStatistiques> {
    const response = await http.get.get<MesStatistiques>({
      endpoint: STATISTIQUES_ENDPOINTS.moi,
      schema: MesStatistiquesSchema,
      transform: (data: unknown) => toCamelCaseDeep(data) as MesStatistiques,
      requireAuth: true,
    });
    return response.data;
  },
};
