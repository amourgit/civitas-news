// ============================================================
// src/services/api/referentiels.service.ts
// Données de référence (catégories, organisations, établissements) —
// bascule automatique mock/réel selon env.useMockData.
// ============================================================

import { env } from '../../config/env';
import type { Categorie, Organisation, Etablissement } from '../../types/global.types';
import { MOCK_CATEGORIES, MOCK_ORGANISATIONS, MOCK_ETABLISSEMENTS } from './mocks/referentiels.mock';
import { referentielsRepository } from './repositories/referentiels.repository';

export const referentielsService = {
  getCategories: async (): Promise<Categorie[]> => {
    if (env.useMockData) return MOCK_CATEGORIES;
    return referentielsRepository.listCategories();
  },

  getOrganisations: async (): Promise<Organisation[]> => {
    if (env.useMockData) return MOCK_ORGANISATIONS;
    return referentielsRepository.listOrganisations();
  },

  getEtablissements: async (): Promise<Etablissement[]> => {
    if (env.useMockData) return MOCK_ETABLISSEMENTS;
    return referentielsRepository.listEtablissements();
  },
};
