// ============================================================
// src/components/backoffice/registry/models/notification.registry.ts
// ============================================================

import { Bell } from 'lucide-react';
import type { ModelDef } from '../types';
import type { NotificationItem } from '../../../../types/global.types';
import { notificationsRepository } from '../../../../services/api/repositories/notifications.repository';
import { PERMISSIONS } from '../../../../lib/permissions/permissions.catalog';

export const notificationModel: ModelDef<NotificationItem> = {
  key: 'notification',
  appLabel: 'Diffusion',
  labelSingular: 'Notification',
  labelPlural: 'Notifications',
  icon: Bell,
  description: "Générées automatiquement par le système — endpoint en lecture seule côté backend (ReadOnlyModelViewSet), aucune création/édition/suppression manuelle possible.",
  viewPermission: PERMISSIONS.BACKOFFICE_NOTIFICATION_VIEW,
  managePermission: PERMISSIONS.BACKOFFICE_NOTIFICATION_VIEW,
  capabilities: { create: false, edit: false, delete: false },
  searchFields: ['titre', 'description'],
  fields: [
    { name: 'titre', label: 'Titre', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea', hiddenInList: true },
    { name: 'format', label: 'Format', type: 'select', options: [
      { value: 'actualite', label: 'Actualité' },
      { value: 'sondage', label: 'Sondage' },
      { value: 'annonce', label: 'Annonce' },
      { value: 'alerte', label: 'Alerte' },
      { value: 'consultation', label: 'Consultation' },
      { value: 'decision', label: 'Décision' },
      { value: 'reforme', label: 'Réforme' },
      { value: 'rapport', label: 'Rapport' },
    ] },
    { name: 'lu', label: 'Lue', type: 'boolean' },
    { name: 'urgente', label: 'Urgente', type: 'boolean', hiddenInList: true },
    { name: 'createdAt', label: 'Créée le', type: 'datetime' },
  ],
  data: {
    list: () => notificationsRepository.list(),
    get: (id) => notificationsRepository.getById(id),
  },
};
