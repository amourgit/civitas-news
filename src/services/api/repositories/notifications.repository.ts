// ============================================================
// src/services/api/repositories/notifications.repository.ts
// Implémentation RÉELLE du domaine Notifications.
// ============================================================

import { z } from 'zod';
import { http } from './httpClient';
import { NOTIFICATIONS_ENDPOINTS } from '../endpoints';
import { NotificationItemSchema, type NotificationItem } from '../../../types/global.types';

export const notificationsRepository = {
  async list(): Promise<NotificationItem[]> {
    const response = await http.get.get<NotificationItem[]>({
      endpoint: NOTIFICATIONS_ENDPOINTS.list,
      schema: z.array(NotificationItemSchema),
      requireAuth: true,
    });
    return response.data;
  },

  async markAsRead(id: string): Promise<void> {
    await http.post.post<Record<string, never>, unknown>({
      endpoint: NOTIFICATIONS_ENDPOINTS.markAsRead(id),
      body: {},
      requireAuth: true,
    });
  },

  async markAllAsRead(): Promise<void> {
    await http.post.post<Record<string, never>, unknown>({
      endpoint: NOTIFICATIONS_ENDPOINTS.markAllAsRead,
      body: {},
      requireAuth: true,
    });
  },
};
