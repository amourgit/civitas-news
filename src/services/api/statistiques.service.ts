// ============================================================
// src/services/api/statistiques.service.ts
// Service Statistiques globales — bascule automatique mock/réel
// selon `env.useMockData`.
// ============================================================

import { env } from '../../config/env';
import type { StatistiquesGlobales } from '../../types/global.types';
import { MOCK_STATISTIQUES_GLOBALES } from './mocks/statistiques.mock';
import { statistiquesRepository } from './repositories/statistiques.repository';

/** Conservé pour compatibilité ascendante (le type canonique vit désormais dans types/models/statistiques.types.ts). */
export type { StatistiquesGlobales };

export const statistiquesService = {
  getStatistiquesGlobales: async (): Promise<StatistiquesGlobales> => {
    if (env.useMockData) {
      return MOCK_STATISTIQUES_GLOBALES;
    }
    return statistiquesRepository.getGlobales();
  },
};
