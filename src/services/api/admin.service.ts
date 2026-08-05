// ============================================================
// src/services/api/admin.service.ts
// Service Administration/Modération — bascule automatique
// mock/réel selon `env.useMockData`.
// ============================================================

import { env } from '../../config/env';
import type { Signalement, AuditLog, Utilisateur } from '../../types/global.types';
import {
  INITIAL_SIGNALEMENTS as MOCK_SIGNALEMENTS,
  INITIAL_AUDIT_LOGS as MOCK_AUDIT_LOGS,
  INITIAL_ADMIN_UTILISATEURS as MOCK_UTILISATEURS,
} from './mocks/admin.mock';
import { adminRepository } from './repositories/admin.repository';

let signalementsList: Signalement[] = env.useMockData ? [...MOCK_SIGNALEMENTS] : [];
let auditLogsList: AuditLog[] = env.useMockData ? [...MOCK_AUDIT_LOGS] : [];
let usersList: Utilisateur[] = env.useMockData ? [...MOCK_UTILISATEURS] : [];

export const adminService = {
  getSignalements: async (): Promise<Signalement[]> => {
    if (env.useMockData) return signalementsList;
    signalementsList = await adminRepository.getSignalements();
    return signalementsList;
  },

  traiterSignalement: async (id: string, reponse: 'traite' | 'rejete'): Promise<Signalement | null> => {
    if (env.useMockData) {
      signalementsList = signalementsList.map((s) => (s.id === id ? { ...s, statut: reponse } : s));
      return signalementsList.find((s) => s.id === id) || null;
    }
    const updated = await adminRepository.traiterSignalement(id, reponse);
    signalementsList = signalementsList.map((s) => (s.id === id ? updated : s));
    return updated;
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    if (env.useMockData) return auditLogsList;
    auditLogsList = await adminRepository.getAuditLogs();
    return auditLogsList;
  },

  getUtilisateurs: async (): Promise<Utilisateur[]> => {
    if (env.useMockData) return usersList;
    usersList = await adminRepository.getUtilisateurs();
    return usersList;
  },
};
