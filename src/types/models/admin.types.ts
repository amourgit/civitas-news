// ============================================================
// src/types/models/admin.types.ts
// Domaine Administration/Modération (signalements, journal d'audit).
// ============================================================

import { z } from 'zod';
import { UtilisateurSchema } from './user.types';

export const SignalementSchema = z.object({
  id: z.string(),
  typeContenu: z.enum(['news', 'sujet', 'commentaire', 'utilisateur', 'sondage']),
  contenuId: z.string(),
  titreOuApercu: z.string(),
  motif: z.enum(['spam', 'propos_inappropries', 'desinformation', 'harcelement', 'autre']),
  description: z.string().optional(),
  auteurSignalement: UtilisateurSchema,
  statut: z.enum(['en_attente', 'traite', 'rejete']),
  createdAt: z.string(),
});
export type Signalement = z.infer<typeof SignalementSchema>;

export const AuditLogSchema = z.object({
  id: z.string(),
  action: z.string(),
  utilisateur: z.string(),
  cible: z.string(),
  horodatage: z.string(),
  /**
   * Le convertisseur camelCase backend (common/camel_case.py) est une
   * regex naïve sans traitement spécial des acronymes :
   * `adresse_ip` -> `adresseIp` (pas `adresseIP`). Champ nommé pour
   * matcher la sortie réelle plutôt que la casse "attendue".
   */
  adresseIp: z.string(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;
