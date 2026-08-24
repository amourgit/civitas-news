// ============================================================
// src/components/backoffice/registry/models/journal.registry.ts
// ============================================================

import { ScrollText } from 'lucide-react';
import type { ModelDef } from '../types';
import type { AuditLog } from '../../../../types/global.types';
import { adminRepository } from '../../../../services/api/repositories/admin.repository';
import { PERMISSIONS } from '../../../../lib/permissions/permissions.catalog';

export const journalModel: ModelDef<AuditLog> = {
  key: 'journal',
  appLabel: 'Système',
  labelSingular: "Événement d'audit",
  labelPlural: "Journal d'audit",
  icon: ScrollText,
  description: "Trace immuable des actions sensibles de la plateforme (ReadOnlyModelViewSet côté backend — aucune écriture possible, par conception).",
  viewPermission: PERMISSIONS.ADMIN_AUDIT_VIEW,
  managePermission: PERMISSIONS.ADMIN_AUDIT_VIEW,
  capabilities: { create: false, edit: false, delete: false },
  searchFields: ['action', 'utilisateur', 'cible'],
  fields: [
    { name: 'action', label: 'Action', type: 'text' },
    { name: 'utilisateur', label: 'Utilisateur', type: 'text' },
    { name: 'cible', label: 'Cible', type: 'text' },
    { name: 'adresseIp', label: 'Adresse IP', type: 'text', hiddenInList: true },
    { name: 'horodatage', label: 'Horodatage', type: 'datetime' },
  ],
  data: {
    list: () => adminRepository.getAuditLogs(),
    get: (id) => adminRepository.getAuditLogById(id),
  },
};
