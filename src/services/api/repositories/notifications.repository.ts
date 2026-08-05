// ============================================================
// src/services/api/repositories/notifications.repository.ts
// Implémentation RÉELLE du domaine Notifications.
// ============================================================

import { http } from './httpClient';
import { NOTIFICATIONS_ENDPOINTS } from '../endpoints';
import { NotificationItemSchema, type NotificationItem } from '../../../types/global.types';
import { paginatedSchema, fetchAllPages } from '../utils/pagination';

export const notificationsRepository = {
  async list(): Promise<NotificationItem[]> {
    return fetchAllPages<NotificationItem>(async (page) => {
      const response = await http.get.get({
        endpoint: NOTIFICATIONS_ENDPOINTS.list,
        params: { page },
        schema: paginatedSchema(NotificationItemSchema),
        requireAuth: true,
      });
      return { results: response.data.results, next: response.data.next };
    });
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
