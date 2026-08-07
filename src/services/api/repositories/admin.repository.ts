// ============================================================
// src/services/api/repositories/admin.repository.ts
// Implémentation RÉELLE du domaine Administration/Modération.
// ============================================================

import { http } from './httpClient';
import { ADMIN_ENDPOINTS, JOURNAL_ENDPOINTS } from '../endpoints';
import { SignalementSchema, AuditLogSchema, UtilisateurSchema } from '../../../types/global.types';
import type { Signalement, AuditLog, Utilisateur } from '../../../types/global.types';
import { paginatedSchema, fetchAllPages } from '../utils/pagination';

export const adminRepository = {
  /** POST /moderation/v1/signalements/ — ouvert à tout utilisateur connecté (pas seulement les modérateurs). */
  async creerSignalement(payload: {
    typeContenu: Signalement['typeContenu'];
    contenuId: string;
    titreOuApercu: string;
    motif: Signalement['motif'];
    description?: string;
  }): Promise<Signalement> {
    const response = await http.post.post<typeof payload, Signalement>({
      endpoint: ADMIN_ENDPOINTS.signalements,
      body: payload,
      responseSchema: SignalementSchema,
      requireAuth: true,
    });
    return response.data;
  },

  async getSignalements(): Promise<Signalement[]> {
    return fetchAllPages<Signalement>(async (page) => {
      const response = await http.get.get({
        endpoint: ADMIN_ENDPOINTS.signalements,
        params: { page },
        schema: paginatedSchema(SignalementSchema),
        requireAuth: true,
      });
      return { results: response.data.results, next: response.data.next };
    });
  },

  async traiterSignalement(id: string, reponse: 'traite' | 'rejete'): Promise<Signalement> {
    const response = await http.post.post<{ statut: 'traite' | 'rejete' }, Signalement>({
      endpoint: ADMIN_ENDPOINTS.traiterSignalement(id),
      body: { statut: reponse },
      responseSchema: SignalementSchema,
      requireAuth: true,
    });
    return response.data;
  },

  /** GET /journal/v1/evenements/ — app backend séparée (journal d'audit immuable). */
  async getAuditLogs(): Promise<AuditLog[]> {
    return fetchAllPages<AuditLog>(async (page) => {
      const response = await http.get.get({
        endpoint: JOURNAL_ENDPOINTS.evenements,
        params: { page },
        schema: paginatedSchema(AuditLogSchema),
        requireAuth: true,
      });
      return { results: response.data.results, next: response.data.next };
    });
  },

  async getUtilisateurs(): Promise<Utilisateur[]> {
    return fetchAllPages<Utilisateur>(async (page) => {
      const response = await http.get.get({
        endpoint: ADMIN_ENDPOINTS.utilisateurs,
        params: { page },
        schema: paginatedSchema(UtilisateurSchema),
        requireAuth: true,
      });
      return { results: response.data.results, next: response.data.next };
    });
  },
};
