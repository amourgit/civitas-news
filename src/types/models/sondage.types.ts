// ============================================================
// src/types/models/sondage.types.ts
// Domaine Sondage — rattaché à une News (ou un Sujet, alias de News).
// ============================================================

import { z } from 'zod';

export const ChoixSondageSchema = z.object({
  id: z.string(),
  libelle: z.string(),
  image: z.string().optional(),
  nombreVotes: z.number().int().nonnegative(),
  pourcentage: z.number().min(0).max(100),
});
export type ChoixSondage = z.infer<typeof ChoixSondageSchema>;

export const SondageSchema = z.object({
  id: z.string(),
  newsId: z.string(),
  sujetId: z.string().optional(),
  titre: z.string(),
  description: z.string().optional(),
  question: z.string(),
  image: z.string().optional(),
  choix: z.array(ChoixSondageSchema),
  dateDebut: z.string(),
  dateFin: z.string(),
  typeVote: z.enum(['unique', 'multiple']),
  anonymat: z.boolean(),
  visibiliteResultat: z.enum(['instantane', 'masque_jusqua_fin']),
  statut: z.enum(['actif', 'programme', 'termine', 'archive']),
  totalVotes: z.number().int().nonnegative(),
  userVotedChoiceIds: z.array(z.string()).optional(),
});
export type Sondage = z.infer<typeof SondageSchema>;
