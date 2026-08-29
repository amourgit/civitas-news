// ============================================================
// src/store/notifications.store.ts
// Store Notifications — bascule automatique mock/réel selon
// `env.useMockData`. Les données de démonstration ont été
// déplacées vers services/api/mocks/notifications.mock.ts et les
// appels réels passent par services/api/repositories/notifications.repository.ts.
// ============================================================

import { useState, useEffect } from 'react';
import type { NotificationItem } from '../types/global.types';
import { env } from '../config/env';
import { INITIAL_NOTIFICATIONS as MOCK_NOTIFICATIONS } from '../services/api/mocks/notifications.mock';
import { notificationsRepository } from '../services/api/repositories/notifications.repository';
import { toast } from '../hooks/useToast';

let notificationsList: NotificationItem[] = env.useMockData ? [...MOCK_NOTIFICATIONS] : [];
let hasFetchedReal = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

/** Charge les notifications réelles une seule fois (paresseux, au premier montage d'un consommateur). */
async function ensureLoaded() {
  if (env.useMockData || hasFetchedReal) return;
  hasFetchedReal = true;
  try {
    notificationsList = await notificationsRepository.list();
    notify();
  } catch (error) {
    console.error('Échec du chargement des notifications:', error);
  }
}

export function useNotificationsStore() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(notificationsList);

  useEffect(() => {
    const handleChange = () => setNotifications([...notificationsList]);
    listeners.add(handleChange);
    ensureLoaded();
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.lu).length;

  const markAsRead = (id: string) => {
    notificationsList = notificationsList.map((n) => (n.id === id ? { ...n, lu: true } : n));
    notify();
    if (!env.useMockData) {
      notificationsRepository.markAsRead(id).catch((error) => {
        console.error('markAsRead a échoué:', error);
        toast('error', 'Synchronisation impossible', 'Le marquage comme lu n’a pas pu être enregistré.');
      });
    }
  };

  const markAllAsRead = () => {
    notificationsList = notificationsList.map((n) => ({ ...n, lu: true }));
    notify();
    if (!env.useMockData) {
      notificationsRepository.markAllAsRead().catch((error) => {
        console.error('markAllAsRead a échoué:', error);
        toast('error', 'Synchronisation impossible', 'Le marquage global n’a pas pu être enregistré.');
      });
    }
  };

  /** Notification générée localement (ex: événement temps réel côté client) — pas d'appel backend. */
  const addNotification = (item: Omit<NotificationItem, 'id' | 'createdAt' | 'lu'>) => {
    const newNotif: NotificationItem = {
      ...item,
      id: 'notif-' + Date.now(),
      lu: false,
      createdAt: new Date().toISOString(),
    };
    notificationsList = [newNotif, ...notificationsList];
    notify();
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
  };
}
