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
  // audio_duration (IntegerField null=True) -> null JSON pour tout
  // commentaire texte (l'immense majorité) : nullable ET optional, pas
  // juste optional, sinon Zod rejette la valeur `null` (distincte
  // d'une clé absente) et fait échouer TOUTE la validation du
  // commentaire — et donc de la page entière de résultats paginés qui
  // le contient (voir paginatedSchema : un seul item invalide invalide
  // tout le tableau). C'est la cause du "fil de discussion vide" alors
  // que des commentaires existent bien en base.
  audioDuration: z.number().nonnegative().nullable().optional(),
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
