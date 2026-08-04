// ============================================================
// src/services/api/repositories/admin.repository.ts
// Implémentation RÉELLE du domaine Administration/Modération.
// ============================================================

import { z } from 'zod';
import { http } from './httpClient';
import { ADMIN_ENDPOINTS } from '../endpoints';
import { SignalementSchema, AuditLogSchema, UtilisateurSchema } from '../../../types/global.types';
import type { Signalement, AuditLog, Utilisateur } from '../../../types/global.types';

export const adminRepository = {
  async getSignalements(): Promise<Signalement[]> {
    const response = await http.get.get<Signalement[]>({
      endpoint: ADMIN_ENDPOINTS.signalements,
      schema: z.array(SignalementSchema),
      requireAuth: true,
    });
    return response.data;
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

  async getAuditLogs(): Promise<AuditLog[]> {
    const response = await http.get.get<AuditLog[]>({
      endpoint: ADMIN_ENDPOINTS.auditLogs,
      schema: z.array(AuditLogSchema),
      requireAuth: true,
    });
    return response.data;
  },

  async getUtilisateurs(): Promise<Utilisateur[]> {
    const response = await http.get.get<Utilisateur[]>({
      endpoint: ADMIN_ENDPOINTS.utilisateurs,
      schema: z.array(UtilisateurSchema),
      requireAuth: true,
    });
    return response.data;
  },
};
