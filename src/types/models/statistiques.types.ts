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

// ============================================================
// Statistiques PERSONNELLES (page Profil) — GET /statistiques/v1/moi/
// Toutes déjà calculées et catégorisées côté backend (voir
// statistiques/api/v1/services.py:calculer_statistiques_utilisateur) :
// aucune donnée de substitution/mock ici, chaque champ vient du backend.
// ============================================================

export const CategorieEngagementSchema = z.object({
  id: z.string(),
  nom: z.string(),
  couleur: z.string().catch('#5B4DFF'),
  icone: z.string().optional().catch(undefined),
  score: z.number().int().nonnegative().catch(0),
});
export type CategorieEngagement = z.infer<typeof CategorieEngagementSchema>;

export const FavoriProfilSchema = z.object({
  id: z.string(),
  slug: z.string(),
  titre: z.string(),
  image: z.string().nullable().catch(null),
  type: z.string(),
  categorieNom: z.string().nullable().catch(null),
  categorieCouleur: z.string().catch('#5B4DFF'),
  scoreEngagement: z.number().int().nonnegative().catch(0),
});
export type FavoriProfil = z.infer<typeof FavoriProfilSchema>;

export const VoteRecentProfilSchema = z.object({
  sondageId: z.string(),
  sondageTitre: z.string(),
  newsSlug: z.string().nullable().catch(null),
  choix: z.array(z.string()).catch([]),
  date: z.string(),
  statut: z.string(),
});
export type VoteRecentProfil = z.infer<typeof VoteRecentProfilSchema>;

export const ActiviteRecenteProfilSchema = z.object({
  type: z.enum(['commentaire', 'reaction', 'vote', 'publication']).catch('commentaire'),
  titre: z.string(),
  extrait: z.string().catch(''),
  date: z.string(),
  newsSlug: z.string().nullable().catch(null),
});
export type ActiviteRecenteProfil = z.infer<typeof ActiviteRecenteProfilSchema>;

export const MesStatistiquesSchema = z.object({
  contributions: z
    .object({
      news: z.number().int().nonnegative().catch(0),
      commentaires: z.number().int().nonnegative().catch(0),
    })
    .catch({ news: 0, commentaires: 0 }),
  interactions: z
    .object({
      reactionsNews: z.number().int().nonnegative().catch(0),
      reactionsCommentaires: z.number().int().nonnegative().catch(0),
      votesSondages: z.number().int().nonnegative().catch(0),
      votesCommentaires: z.number().int().nonnegative().catch(0),
    })
    .catch({ reactionsNews: 0, reactionsCommentaires: 0, votesSondages: 0, votesCommentaires: 0 }),
  engagementRecu: z
    .object({
      reactions: z.number().int().nonnegative().catch(0),
      commentaires: z.number().int().nonnegative().catch(0),
      vues: z.number().int().nonnegative().catch(0),
    })
    .catch({ reactions: 0, commentaires: 0, vues: 0 }),
  topCategories: z.array(CategorieEngagementSchema).catch([]),
  favoris: z.array(FavoriProfilSchema).catch([]),
  votesRecents: z.array(VoteRecentProfilSchema).catch([]),
  activiteRecente: z.array(ActiviteRecenteProfilSchema).catch([]),
});
export type MesStatistiques = z.infer<typeof MesStatistiquesSchema>;
