// ============================================================
// src/types/models/news.types.ts
// Domaine News — entité centrale de la plateforme. "Sujet" est un
// alias historique de "News" conservé pour compatibilité.
// ============================================================

import { z } from 'zod';
import { UtilisateurSchema, OrganisationSchema, EtablissementSchema } from './user.types';
import { SondageSchema } from './sondage.types';
import { LienPublicationSchema } from './lien.types';

export const NewsTypeSchema = z.enum([
  'projet',
  'evenement',
  'annonce',
  'sondage',
  'consultation',
  'petition',
  'information',
  'reforme',
  'idee',
  'conference',
  'reunion',
  'atelier',
  'appel_participation',
  'article',
  'publication',
  'actualite',
]);
export type NewsType = z.infer<typeof NewsTypeSchema>;
/** Alias historique, conservé pour compatibilité ascendante. */
export type SujetType = NewsType;

export const TypeReactionSchema = z.enum(['coeur', 'jaime', 'bravo', 'youpi', 'wow', 'jaimepas']);
export type TypeReaction = z.infer<typeof TypeReactionSchema>;

export const NewsStatsSchema = z.object({
  vues: z.number().int().nonnegative(),
  commentaires: z.number().int().nonnegative(),
  reactions: z.record(TypeReactionSchema, z.number().int().nonnegative()),
  votes: z.number().int().nonnegative(),
  partages: z.number().int().nonnegative(),
});
export type NewsStats = z.infer<typeof NewsStatsSchema>;
export type SujetStats = NewsStats;

export const NewsMediaTypeSchema = z.enum(['image', 'video', 'youtube', 'audio', 'document']);
export type NewsMediaType = z.infer<typeof NewsMediaTypeSchema>;
export type SujetMediaType = NewsMediaType;

export const NewsMediaItemSchema = z.object({
  id: z.string(),
  type: NewsMediaTypeSchema,
  url: z.string(),
  thumbnail: z.string().nullable().optional(),
  titre: z.string(),
  description: z.string().optional(),
  duree: z.string().optional(),
  vues: z.number().int().nonnegative().optional(),
  date: z.string().optional(),
});
export type NewsMediaItem = z.infer<typeof NewsMediaItemSchema>;
export type SujetMediaItem = NewsMediaItem;

export const DocumentJointSchema = z.object({
  id: z.string(),
  nom: z.string(),
  url: z.string(),
  /** taille en octets */
  taille: z.number().int().nonnegative(),
  type: z.string(),
});
export type DocumentJoint = z.infer<typeof DocumentJointSchema>;

export const CategorieSchema = z.object({
  id: z.string(),
  nom: z.string(),
  couleur: z.string(),
  icone: z.string(),
});
export type Categorie = z.infer<typeof CategorieSchema>;

export const NewsSchema = z.object({
  id: z.string(),
  slug: z.string(),
  type: NewsTypeSchema,
  titre: z.string(),
  description: z.string(),
  contenu: z.string().optional(),
  image: z.string(),
  galerie: z.array(z.string()).optional(),
  auteur: UtilisateurSchema,
  // FK nullable côté modèle (null=True, blank=True) -> null JSON quand absent, pas une clé omise.
  organisation: OrganisationSchema.nullable().optional(),
  etablissement: EtablissementSchema.nullable().optional(),
  categorie: CategorieSchema,
  tags: z.array(z.string()),
  province: z.string().optional(),
  lieu: z.string().optional(),
  // DateTimeField(null=True, blank=True) côté modèle -> même chose.
  dateDebut: z.string().nullable().optional(),
  dateFin: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  statut: z.enum(['brouillon', 'publie', 'archive', 'signale']),
  visibilite: z.enum(['public', 'prive', 'limite']),
  stats: NewsStatsSchema,
  // Présents uniquement en détail (NewsSerializer), absents des réponses
  // de liste (NewsListSerializer, backend news/api/v1/serializers.py) :
  sondages: z.array(SondageSchema).optional(),
  documents: z.array(DocumentJointSchema).optional(),
  medias: z.array(NewsMediaItemSchema).optional(),
  // Présent en détail mais peut valoir `null` (get_lien_publication
  // renvoie None si la News n'a pas encore de lien généré) : nullable
  // ET optional, pas juste optional (JSON `null` != clé absente pour Zod).
  lienPublication: LienPublicationSchema.nullable().optional(),
  userReaction: TypeReactionSchema.nullable().optional(),
});
export type News = z.infer<typeof NewsSchema>;

/** Alias historique : Sujet === News. */
export type Sujet = News;
export const SujetSchema = NewsSchema;
