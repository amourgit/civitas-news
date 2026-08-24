// ============================================================
// src/services/api/repositories/referentiels.repository.ts
// Domaine « Référentiels » (app backend `referentiels/`) : Catégories,
// Organisations, Établissements. Historiquement lecture seule (simples
// sélecteurs du formulaire News) — étendu ici en CRUD complet pour le
// backoffice (voir src/components/backoffice/), le backend exposant
// déjà `SocleModelViewSet` (ModelViewSet complet) sur les trois
// ressources, réservé aux modérateurs/administrateurs en écriture
// (voir referentiels/api/v1/views.py + common/permissions.py).
// ============================================================

import { http } from './httpClient';
import { REFERENTIELS_ENDPOINTS } from '../endpoints';
import {
  CategorieSchema, OrganisationSchema, EtablissementSchema,
  type Categorie, type Organisation, type Etablissement,
  type CategorieEcriturePayload, type OrganisationEcriturePayload, type EtablissementEcriturePayload,
} from '../../../types/global.types';
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

  async getCategorie(id: string): Promise<Categorie> {
    const response = await http.get.get<Categorie>({
      endpoint: REFERENTIELS_ENDPOINTS.categorieDetail(id),
      schema: CategorieSchema,
      requireAuth: false,
    });
    return response.data;
  },

  async createCategorie(payload: CategorieEcriturePayload): Promise<Categorie> {
    const response = await http.post.post<CategorieEcriturePayload, Categorie>({
      endpoint: REFERENTIELS_ENDPOINTS.categories,
      body: payload,
      responseSchema: CategorieSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async updateCategorie(id: string, payload: Partial<CategorieEcriturePayload>): Promise<Categorie> {
    const response = await http.update.patch<Partial<CategorieEcriturePayload>, Categorie>({
      endpoint: REFERENTIELS_ENDPOINTS.categories,
      resourceId: id,
      patches: payload,
      responseSchema: CategorieSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async removeCategorie(id: string): Promise<void> {
    await http.delete.delete({ endpoint: REFERENTIELS_ENDPOINTS.categories, resourceId: id, requireAuth: true });
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

  async getOrganisation(id: string): Promise<Organisation> {
    const response = await http.get.get<Organisation>({
      endpoint: REFERENTIELS_ENDPOINTS.organisationDetail(id),
      schema: OrganisationSchema,
      requireAuth: false,
    });
    return response.data;
  },

  /** `logo` en pièce jointe optionnelle (multipart) à la création — le
   * champ n'existe qu'en écriture, jamais mis à jour ensuite depuis ce
   * formulaire (même limitation assumée que `newsRepository.update`,
   * qui ne permet pas non plus de changer l'image de couverture d'une
   * News déjà créée). */
  async createOrganisation(payload: OrganisationEcriturePayload & { logo?: File }): Promise<Organisation> {
    const { logo, ...scalarFields } = payload;
    if (logo) {
      const response = await http.post.uploadFiles<Organisation>({
        endpoint: REFERENTIELS_ENDPOINTS.organisations,
        files: [logo],
        fieldName: 'logo',
        additionalFields: scalarFields as Record<string, unknown>,
        responseSchema: OrganisationSchema,
        requireAuth: true,
      });
      return response.data;
    }
    const response = await http.post.post<OrganisationEcriturePayload, Organisation>({
      endpoint: REFERENTIELS_ENDPOINTS.organisations,
      body: scalarFields,
      responseSchema: OrganisationSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async updateOrganisation(id: string, payload: Partial<OrganisationEcriturePayload>): Promise<Organisation> {
    const response = await http.update.patch<Partial<OrganisationEcriturePayload>, Organisation>({
      endpoint: REFERENTIELS_ENDPOINTS.organisations,
      resourceId: id,
      patches: payload,
      responseSchema: OrganisationSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async removeOrganisation(id: string): Promise<void> {
    await http.delete.delete({ endpoint: REFERENTIELS_ENDPOINTS.organisations, resourceId: id, requireAuth: true });
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

  async getEtablissement(id: string): Promise<Etablissement> {
    const response = await http.get.get<Etablissement>({
      endpoint: REFERENTIELS_ENDPOINTS.etablissementDetail(id),
      schema: EtablissementSchema,
      requireAuth: false,
    });
    return response.data;
  },

  async createEtablissement(payload: EtablissementEcriturePayload): Promise<Etablissement> {
    const response = await http.post.post<EtablissementEcriturePayload, Etablissement>({
      endpoint: REFERENTIELS_ENDPOINTS.etablissements,
      body: payload,
      responseSchema: EtablissementSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async updateEtablissement(id: string, payload: Partial<EtablissementEcriturePayload>): Promise<Etablissement> {
    const response = await http.update.patch<Partial<EtablissementEcriturePayload>, Etablissement>({
      endpoint: REFERENTIELS_ENDPOINTS.etablissements,
      resourceId: id,
      patches: payload,
      responseSchema: EtablissementSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async removeEtablissement(id: string): Promise<void> {
    await http.delete.delete({ endpoint: REFERENTIELS_ENDPOINTS.etablissements, resourceId: id, requireAuth: true });
  },
};
