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
  /** Citoyens inscrits sur la plateforme (distinct de totalVisiteurs, qui compte aussi les anonymes). */
  totalCitoyensInscrits: z.number().int().nonnegative().optional(),
  croissanceMensuelle: z.number(),
  participationParProvince: z.array(
    z.object({
      province: z.string(),
      votes: z.number().int().nonnegative(),
      news: z.number().int().nonnegative(),
      sujets: z.number().int().nonnegative().optional(),
      /** Commentaires enregistrés dans la province (utilisé par le comparatif votes/débats). */
      commentaires: z.number().int().nonnegative().optional(),
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
  /** Série mensuelle pour le graphe d'évolution de la participation (BentoAreaEvolution). */
  evolutionMensuelle: z.array(
    z.object({
      mois: z.string(),
      participation: z.number().int().nonnegative(),
    })
  ).optional(),
  /** Répartition des consultations selon leur suite gouvernementale (BentoRadialKPIs). */
  statutsConsultations: z.array(
    z.object({
      statut: z.enum(['adoptee', 'analyse', 'attente']),
      label: z.string(),
      pourcentage: z.number().min(0).max(100),
      compteur: z.number().int().nonnegative(),
      couleur: z.string(),
    })
  ).optional(),
  /** Indicateurs d'inclusivité et de parité (BentoGaugeParity). */
  parite: z.object({
    scoreRepresentativite: z.number().min(0).max(100),
    hommesPct: z.number().min(0).max(100),
    femmesPct: z.number().min(0).max(100),
    tranche1835Pct: z.number().min(0).max(100),
  }).optional(),
});
export type StatistiquesGlobales = z.infer<typeof StatistiquesGlobalesSchema>;
