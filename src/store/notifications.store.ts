import { useState, useEffect } from 'react';
import { NotificationItem } from '../types/global.types';

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  // --- AUJOURD'HUI (TODAY) ---
  {
    id: 'notif-101',
    type: 'mention',
    contenu: 'vous a mentionné dans un commentaire dans la discussion :',
    lien: '/news/reforme-transport-etudiant-2026',
    lu: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 1 Min Ago
    auteur: {
      nom: 'Alex Huan',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    },
    badgeType: 'push',
    tag: 'TN38',
    categoryTab: 'review',
    workedTime: 'Temps de travail: 10H 20M',
    notice: '⚠️ Assurez-vous d\'avoir relu l\'ensemble des propositions avant d\'approuver la news.',
    actions: [
      { label: 'Voir le travail', variant: 'outline', actionKey: 'view' },
      { label: 'Approuver', variant: 'success', actionKey: 'approve' },
    ],
  },
  {
    id: 'notif-102',
    type: 'mention',
    contenu: 'vous a mentionné dans un commentaire dans une discussion :',
    lien: '/news/attribution-bourses-etudiantes-excellence',
    lu: false,
    createdAt: new Date(Date.now() - 1000 * 3600 * 1).toISOString(), // 1h ago
    auteur: {
      nom: 'Mia Anders',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    },
    badgeType: 'mention',
    tag: 'FA-1',
    categoryTab: 'direct',
    workedTime: 'Lecture 3 min',
    actions: [
      { label: 'Voir la discussion', variant: 'outline', actionKey: 'view' },
      { label: 'Répondre', variant: 'primary', actionKey: 'reply' },
    ],
  },
  {
    id: 'notif-103',
    type: 'nouvelle_news',
    contenu: 'a créé une nouvelle News Nationale dans le Département DEV :',
    lien: '/news/consultation-plan-numerique-campus',
    lu: false,
    createdAt: new Date(Date.now() - 1000 * 3600 * 4).toISOString(), // 4h ago
    auteur: {
      nom: 'Jay Autumn',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
    badgeType: 'goal',
    tag: 'GOAL',
    categoryTab: 'direct',
    workedTime: 'Temps: 2H 15M',
    actions: [
      { label: 'Voir le projet', variant: 'outline', actionKey: 'view' },
      { label: 'Soutenir', variant: 'purple', actionKey: 'support' },
    ],
  },
  {
    id: 'notif-104',
    type: 'review',
    contenu: 'a soumis le projet TN38 pour :',
    lien: '/news/reforme-transport-etudiant-2026',
    lu: false,
    createdAt: new Date(Date.now() - 1000 * 3600 * 5).toISOString(), // 5h ago
    auteur: {
      nom: 'Cary Wilson',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80',
    },
    badgeType: 'push',
    tag: 'TN38 • Prêt pour Vote',
    categoryTab: 'ready',
    workedTime: 'Temps de travail: 10H 20M',
    actions: [
      { label: 'Voir le travail', variant: 'outline', actionKey: 'view' },
      { label: 'Assigner Modérateur', variant: 'secondary', actionKey: 'assign' },
      { label: 'Demander remise', variant: 'blue', actionKey: 'handoff' },
    ],
  },
  {
    id: 'notif-105',
    type: 'rejet',
    contenu: 'a rejeté le Bon de Commande Officiel :',
    lien: '/news/budget-infrastructure-libreville',
    lu: true,
    createdAt: new Date(Date.now() - 1000 * 3600 * 8).toISOString(), // 08:42
    auteur: {
      nom: 'Daniel Meyers',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    },
    badgeType: 'rejected',
    tag: 'PO#1302',
    categoryTab: 'direct',
    workedTime: '08:42',
    actions: [
      { label: 'Consulter le motif', variant: 'outline', actionKey: 'view' },
    ],
  },

  // --- HIER (YESTERDAY) ---
  {
    id: 'notif-201',
    type: 'commentaire',
    contenu: 'a commenté dans la discussion TN38 : "Est-ce que ce décret nécessite une approbation parlementaire ?"',
    lien: '/news/consultation-plan-numerique-campus',
    lu: true,
    createdAt: new Date(Date.now() - 1000 * 3600 * 25).toISOString(), // Yesterday
    auteur: {
      nom: 'Mike Dowson',
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&auto=format&fit=crop&q=80',
    },
    badgeType: 'comment',
    tag: 'TN38',
    categoryTab: 'comments',
    workedTime: 'Temps: 10H 20M',
    actions: [
      { label: 'Voir le travail', variant: 'outline', actionKey: 'view' },
      { label: 'Répondre', variant: 'primary', actionKey: 'reply' },
      { label: 'Inviter à une réunion civique', variant: 'pink', actionKey: 'invite_meeting' },
    ],
  },
  {
    id: 'notif-202',
    type: 'review',
    contenu: 'a transmitted le dossier TN42 pour :',
    lien: '/news/attribution-bourses-etudiantes-excellence',
    lu: true,
    createdAt: new Date(Date.now() - 1000 * 3600 * 27).toISOString(),
    auteur: {
      nom: 'Smithy Wing',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    },
    badgeType: 'push',
    tag: 'TN42',
    categoryTab: 'ready',
    workedTime: 'Temps: 7H 40M',
    actions: [
      { label: 'Voir le travail', variant: 'outline', actionKey: 'view' },
      { label: 'Assigner Modérateur', variant: 'secondary', actionKey: 'assign' },
      { label: 'Demander remise', variant: 'blue', actionKey: 'handoff' },
    ],
  },
  {
    id: 'notif-203',
    type: 'commentaire',
    contenu: 'a commenté dans la discussion :',
    lien: '/news/reforme-transport-etudiant-2026',
    lu: true,
    createdAt: new Date(Date.now() - 1000 * 3600 * 28).toISOString(), // 07/27/21 • 18:21
    auteur: {
      nom: 'Mike Whits',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80',
    },
    badgeType: 'comment',
    tag: 'FA-1',
    categoryTab: 'comments',
    workedTime: '18:21',
    actions: [
      { label: 'Afficher la réponse', variant: 'outline', actionKey: 'view' },
    ],
  },
  {
    id: 'notif-204',
    type: 'invitation',
    contenu: 'vous a invité à rejoindre le Département :',
    lien: '/organisation/finance-team',
    lu: true,
    createdAt: new Date(Date.now() - 1000 * 3600 * 32).toISOString(), // 07/27/21 • 12:00
    auteur: {
      nom: 'Daniel Meyers',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    },
    badgeType: 'invite',
    tag: 'FINANCE TEAM',
    categoryTab: 'direct',
    workedTime: '12:00',
    actions: [
      { label: 'Rejoindre l\'équipe', variant: 'primary', actionKey: 'join' },
    ],
  },

  // --- PLUS ANCIENS ---
  {
    id: 'notif-301',
    type: 'commentaire',
    contenu: 'a commenté sur TN48 : "Quelles sont les priorités documentaires pour ce volet ?"',
    lien: '/news/reforme-transport-etudiant-2026',
    lu: true,
    createdAt: new Date(Date.now() - 1000 * 3600 * 50).toISOString(),
    auteur: {
      nom: 'Jack Mileson',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    },
    badgeType: 'comment',
    tag: 'TN48',
    categoryTab: 'comments',
    workedTime: 'Temps: 10H 20M',
    actions: [
      { label: 'Voir le travail', variant: 'outline', actionKey: 'view' },
      { label: 'Répondre', variant: 'primary', actionKey: 'reply' },
      { label: 'Inviter à une réunion', variant: 'pink', actionKey: 'invite_meeting' },
    ],
  },
];

let notificationsList: NotificationItem[] = INITIAL_NOTIFICATIONS;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function useNotificationsStore() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(notificationsList);

  useEffect(() => {
    const handleChange = () => setNotifications([...notificationsList]);
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.lu).length;

  const markAsRead = (id: string) => {
    notificationsList = notificationsList.map((n) => (n.id === id ? { ...n, lu: true } : n));
    notify();
  };

  const markAllAsRead = () => {
    notificationsList = notificationsList.map((n) => ({ ...n, lu: true }));
    notify();
  };

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

