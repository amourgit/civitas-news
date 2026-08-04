// ============================================================
// src/types/models/statistiques.types.ts
// Domaine Statistiques globales (tableau de bord).
// ============================================================

import { z } from 'zod';

export const StatistiquesGlobalesSchema = z.object({
  totalVisiteurs: z.number().int().nonnegative(),
  totalVotes: z.number().int().nonnegative(),
  totalCommentaires: z.number().int().nonnegative(),
  totalNewsActives: z.number().int().nonnegative(),
  totalSujetsActifs: z.number().int().nonnegative().optional(),
  totalOrganisations: z.number().int().nonnegative(),
  croissanceMensuelle: z.number(),
  participationParProvince: z.array(
    z.object({
      province: z.string(),
      votes: z.number().int().nonnegative(),
      news: z.number().int().nonnegative(),
      sujets: z.number().int().nonnegative().optional(),
    })
  ),
  repartitionParCategorie: z.array(
    z.object({
      category: z.string(),
      count: z.number().int().nonnegative(),
      percentage: z.number().min(0).max(100),
    })
  ),
  activiteParHeure: z.array(
    z.object({
      heure: z.string(),
      votes: z.number().int().nonnegative(),
      commentaires: z.number().int().nonnegative(),
    })
  ),
});
export type StatistiquesGlobales = z.infer<typeof StatistiquesGlobalesSchema>;
