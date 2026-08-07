// ============================================================
// src/types/models/commentaire.types.ts
// Domaine Commentaire (fil de discussion sous une News/Sujet).
// ============================================================

import { z } from 'zod';
import { UtilisateurSchema } from './user.types';

export const MediaJointSchema = z.object({
  id: z.string(),
  type: z.enum(['image', 'gif', 'audio', 'video', 'document']),
  url: z.string(),
});
export type MediaJoint = z.infer<typeof MediaJointSchema>;

export const CommentaireSchema = z.object({
  id: z.string(),
  newsId: z.string(),
  sujetId: z.string().optional(),
  auteur: UtilisateurSchema,
  typeContenu: z.enum(['texte', 'audio']).optional(),
  // get_audio_url renvoie None si pas d'audio_fichier -> null JSON.
  audioUrl: z.string().nullable().optional(),
  audioDuration: z.number().nonnegative().optional(),
  contenu: z.string(),
  media: z.array(MediaJointSchema).optional(),
  /** id du commentaire parent (fil de réponses) — get_reponse_a renvoie None si racine -> null JSON. */
  reponseA: z.string().nullable().optional(),
  mentions: z.array(z.string()).optional(),
  reactions: z.record(z.string(), z.number()),
  userReactions: z.array(z.string()).optional(),
  votes: z.number().int(),
  userVoteStatus: z.enum(['up', 'down']).nullable().optional(),
  estEpingle: z.boolean(),
  estReponseAcceptee: z.boolean(),
  estAdministrateur: z.boolean(),
  createdAt: z.string(),
});
export type Commentaire = z.infer<typeof CommentaireSchema>;
