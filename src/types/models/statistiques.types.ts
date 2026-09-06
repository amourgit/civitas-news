// ============================================================
// src/types/models/statistiques.types.ts
// Domaine Statistiques globales (tableau de bord).
// ============================================================

import { z } from 'zod';

export const StatistiquesGlobalesSchema = z.object({
  totalVisiteurs: z.number().int().nonnegative().catch(0),
  totalVotes: z.number().int().nonnegative().catch(0),
  totalCommentaires: z.number().int().nonnegative().catch(0),
  totalNewsActives: z.number().int().nonnegative().catch(0),
  totalSujetsActifs: z.number().int().nonnegative().optional().catch(undefined),
  totalOrganisations: z.number().int().nonnegative().catch(0),
  /** Citoyens inscrits sur la plateforme (distinct de totalVisiteurs, qui compte aussi les anonymes). */
  totalCitoyensInscrits: z.number().int().nonnegative().optional().catch(undefined),
  croissanceMensuelle: z.number().catch(0),
  /** % de News publiées disposant d'un LienPublication généré (voir
   * statistiques/api/v1/services.py:calculer_statistiques_globales côté
   * backend) -- pas automatique à la publication, un ratio < 100% est
   * normal. */
  tauxTransparence: z.number().min(0).max(100).optional().catch(undefined),
  // Repli .catch() au niveau du TABLEAU entier (pas champ par champ à
  // l'intérieur) : un tableau manquant ou de forme totalement invalide
  // retombe sur [] plutôt que de faire échouer toute la validation --
  // sans pour autant rendre chaque propriété optionnelle dans le type
  // inféré (voir statistiques.repository.ts pour la normalisation de
  // casse snake_case -> camelCase appliquée juste avant cette validation,
  // qui couvre la cause la plus probable d'un tableau bien formé mais
  // aux clés renommées).
  participationParProvince: z
    .array(
      z.object({
        province: z.string(),
        votes: z.number().int().nonnegative(),
        news: z.number().int().nonnegative(),
        sujets: z.number().int().nonnegative().optional(),
        /** Commentaires enregistrés dans la province (utilisé par le comparatif votes/débats). */
        commentaires: z.number().int().nonnegative().optional(),
      })
    )
    .catch([]),
  repartitionParCategorie: z
    .array(
      z.object({
        category: z.string(),
        count: z.number().int().nonnegative(),
        percentage: z.number().min(0).max(100),
      })
    )
    .catch([]),
  activiteParHeure: z
    .array(
      z.object({
        heure: z.string(),
        votes: z.number().int().nonnegative(),
        commentaires: z.number().int().nonnegative(),
      })
    )
    .catch([]),
  /** Série mensuelle pour le graphe d'évolution de la participation (BentoAreaEvolution). */
  evolutionMensuelle: z.array(
    z.object({
      mois: z.string(),
      participation: z.number().int().nonnegative(),
    })
  ).optional().catch(undefined),
  /** Répartition des consultations selon leur suite gouvernementale (BentoRadialKPIs). */
  /**
   * Répartition des consultations par statut (BentoRadialKPIs). En mode
   * mock : 3 statuts fictifs illustratifs (adoptee/analyse/attente). En
   * mode réel : distribution réelle des News par `statut` backend
   * (brouillon/publie/archive/signale, voir news/models.py). D'où un
   * `statut` en chaîne libre plutôt qu'un enum fixe à 3 valeurs.
   */
  statutsConsultations: z.array(
    z.object({
      statut: z.string(),
      label: z.string(),
      pourcentage: z.number().min(0).max(100),
      compteur: z.number().int().nonnegative(),
      couleur: z.string(),
    })
  ).optional().catch(undefined),
  /** Indicateurs d'inclusivité et de parité (BentoGaugeParity). */
  parite: z.object({
    scoreRepresentativite: z.number().min(0).max(100),
    hommesPct: z.number().min(0).max(100),
    femmesPct: z.number().min(0).max(100),
    tranche1835Pct: z.number().min(0).max(100),
  }).optional().catch(undefined),
});
export type StatistiquesGlobales = z.infer<typeof StatistiquesGlobalesSchema>;
