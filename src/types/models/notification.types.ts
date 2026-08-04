// ============================================================
// src/types/models/notification.types.ts
// Domaine Notification (fil d'activité personnel de l'utilisateur).
// ============================================================

import { z } from 'zod';

export const NotificationActionSchema = z.object({
  label: z.string(),
  variant: z
    .enum(['primary', 'secondary', 'outline', 'danger', 'purple', 'pink', 'blue', 'success', 'warning'])
    .optional(),
  actionKey: z.string(),
  url: z.string().optional(),
  toastTitle: z.string().optional(),
  toastMessage: z.string().optional(),
  toastType: z.enum(['success', 'warning', 'info', 'error', 'purple']).optional(),
});
export type NotificationAction = z.infer<typeof NotificationActionSchema>;

export const NotificationFormatSchema = z.enum([
  'actualite',
  'sondage',
  'annonce',
  'alerte',
  'consultation',
  'decision',
  'reforme',
  'rapport',
]);
export type NotificationFormat = z.infer<typeof NotificationFormatSchema>;

export const NotificationItemSchema = z.object({
  id: z.string(),
  format: NotificationFormatSchema,
  titre: z.string(),
  description: z.string(),
  categorie: z.object({
    nom: z.string(),
    couleur: z.string(),
    icone: z.string().optional(),
  }),
  lien: z.string(),
  lu: z.boolean(),
  createdAt: z.string(),
  /** ex: 'RÉF-2026-01', 'TN38' */
  tag: z.string().optional(),
  urgente: z.boolean().optional(),
  categoryTab: z.enum(['all', 'direct', 'news', 'sondages', 'alertes']).optional(),
  notice: z.string().optional(),
  actions: z.array(NotificationActionSchema).optional(),

  // Champs conservés pour compatibilité ascendante
  type: z.string().optional(),
  contenu: z.string().optional(),
  auteur: z
    .object({
      nom: z.string(),
      avatar: z.string().optional(),
    })
    .optional(),
  badgeType: z.enum(['comment', 'goal', 'rejected', 'invite', 'review', 'push', 'mention']).optional(),
  workedTime: z.string().optional(),
});
export type NotificationItem = z.infer<typeof NotificationItemSchema>;
