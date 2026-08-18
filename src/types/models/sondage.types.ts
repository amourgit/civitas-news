// ============================================================
// src/types/models/sondage.types.ts
// Domaine Sondage — rattaché à une News (ou un Sujet, alias de News).
// ============================================================

import { z } from 'zod';
import { UtilisateurSchema } from './user.types';

export const ChoixSondageSchema = z.object({
  id: z.string(),
  libelle: z.string(),
  image: z.string().nullable().optional(),
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
  image: z.string().nullable().optional(),
  choix: z.array(ChoixSondageSchema),
  dateDebut: z.string(),
  dateFin: z.string(),
  typeVote: z.enum(['unique', 'multiple']),
  anonymat: z.boolean(),
  visibiliteResultat: z.enum(['instantane', 'masque_jusqua_fin']),
  statut: z.enum(['actif', 'programme', 'termine', 'archive']),
  totalVotes: z.number().int().nonnegative(),
  userVotedChoiceIds: z.array(z.string()).optional(),
  // Fait foi côté serveur pour l'affichage des résultats agrégés
  // (totalVotes/nombreVotes/pourcentage) quand `visibiliteResultat`
  // vaut 'masque_jusqua_fin' : true tant que le sondage est actif +
  // instantané, ou dès la clôture, ou pour l'auteur/un modérateur, ou
  // pour quiconque a déjà voté. userVotedChoiceIds reste, lui, TOUJOURS
  // renseigné indépendamment de ce flag (ce n'est pas "le résultat",
  // c'est la confirmation de son propre vote).
  resultatsVisibles: z.boolean().optional(),
  // Métadonnées communes (auparavant absentes de ce contrat, alignées
  // maintenant sur NewsSchema : voir news.types.ts).
  auteur: UtilisateurSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Sondage = z.infer<typeof SondageSchema>;
