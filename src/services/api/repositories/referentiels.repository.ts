import { http } from './httpClient';
import { REFERENTIELS_ENDPOINTS } from '../endpoints';
import { CategorieSchema, OrganisationSchema, EtablissementSchema } from '../../../types/global.types';
import type { Categorie, Organisation, Etablissement } from '../../../types/global.types';
import { paginatedSchema, fetchAllPages } from '../utils/pagination';

export const referentielsRepository = {
  async listCategories(): Promise<Categorie[]> {
    return fetchAllPages<Categorie>(async (page) => {
      const response = await http.get.get({
        endpoint: REFERENTIELS_ENDPOINTS.categories,
        params: { page },
        schema: paginatedSchema(CategorieSchema),
        requireAuth: false,
      });
      return { results: response.data.results, next: response.data.next };
    });
  },

  async listOrganisations(): Promise<Organisation[]> {
    return fetchAllPages<Organisation>(async (page) => {
      const response = await http.get.get({
        endpoint: REFERENTIELS_ENDPOINTS.organisations,
        params: { page },
        schema: paginatedSchema(OrganisationSchema),
        requireAuth: false,
      });
      return { results: response.data.results, next: response.data.next };
    });
  },

  async listEtablissements(): Promise<Etablissement[]> {
    return fetchAllPages<Etablissement>(async (page) => {
      const response = await http.get.get({
        endpoint: REFERENTIELS_ENDPOINTS.etablissements,
        params: { page },
        schema: paginatedSchema(EtablissementSchema),
        requireAuth: false,
      });
      return { results: response.data.results, next: response.data.next };
    });
  },
};
