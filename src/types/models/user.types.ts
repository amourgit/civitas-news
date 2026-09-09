// ============================================================
// src/types/models/user.types.ts
// Domaine Utilisateur — schéma canonique (Zod) + types dérivés.
//
// Note backend (Backend-Core-Base, branche civitas-news) :
// le modèle User Django brut ne porte que
// { id, username, email, first_name, last_name, is_active, date_joined }
// (voir types/models/backend.types.ts:BackendUserSchema — c'est ce que
// renvoie /users/v1/users/). Les champs enrichis ci-dessous (avatar,
// role, badges, stats, etablissement) existent déjà côté backend, mais
// UNIQUEMENT en tant qu'objet imbriqué en lecture seule
// (users/api/v1/serializers.py:UtilisateurPublicSerializer), exposé
// dans news.auteur, commentaire.auteur, signalement.auteurSignalement
// — jamais comme un endpoint /users/... autonome à ce jour.
// ============================================================

import { z } from 'zod';
import { SocleTracabiliteSchema, type StatutCycleVie } from './common.types';

export const RoleUtilisateurSchema = z.enum([
  'anonyme',
  'etudiant',
  'moderateur',
  'administrateur',
  'organisation',
]);
export type RoleUtilisateur = z.infer<typeof RoleUtilisateurSchema>;

export const BadgeSchema = z.object({
  id: z.string(),
  nom: z.string(),
  icone: z.string(),
  description: z.string(),
});
export type Badge = z.infer<typeof BadgeSchema>;

export const UtilisateurStatsSchema = z.object({
  contributions: z.number().int().nonnegative(),
  votes: z.number().int().nonnegative(),
  commentaires: z.number().int().nonnegative(),
});

export const UtilisateurSchema = z.object({
  id: z.string(),
  username: z.string(),
  nomAffiche: z.string(),
  // get_avatar renvoie None si pas de profile_picture -> null JSON, pas
  // une clé absente : nullable ET optional (pas juste optional).
  avatar: z.string().nullable().optional(),
  // Depuis la réforme identité globale / adhésion tenant (Backend-Core-Base,
  // commit e72cf35) : role/etablissement/badges sont résolus via
  // adhesions.MembreTenant DANS LE TENANT COURANT, plus via un champ direct
  // de User. get_role() renvoie None si aucune adhésion n'existe pour cet
  // utilisateur dans ce tenant (compte créé avant la réforme et pas encore
  // migré, ou compte global sans adhésion à cet espace) -> nullable
  // obligatoire ici, sinon UNE SEULE news dont l'auteur n'a pas encore
  // d'adhésion fait échouer le .parse() Zod de TOUTE la page (voir
  // paginatedSchema en amont) et vide tout le fil de news côté UI.
  role: RoleUtilisateurSchema.nullable(),
  // CharField(source='etablissement.nom', default=None) -> null JSON si
  // l'utilisateur n'a pas d'établissement.
  etablissement: z.string().nullable().optional(),
  email: z.string().optional(),
  badges: z.array(BadgeSchema),
  stats: UtilisateurStatsSchema,
});
export type Utilisateur = z.infer<typeof UtilisateurSchema>;

export const TypeOrganisationSchema = z.enum([
  'association_etudiante',
  'administration',
  'club',
  'departement',
  'autre',
]);
export type TypeOrganisation = z.infer<typeof TypeOrganisationSchema>;
export const TYPE_ORGANISATION_LABELS: Record<TypeOrganisation, string> = {
  association_etudiante: 'Association étudiante',
  administration: 'Administration',
  club: 'Club',
  departement: 'Département académique',
  autre: 'Autre',
};

/**
 * Plateformes de réseaux sociaux RECONNUES côté frontend (voir
 * ORGANISATION_SOCIAL_ICONS, NewsCardAuthorBadge.tsx) — le backend, lui,
 * n'impose aucune contrainte de clé sur `reseaux_sociaux` (simple
 * JSONField libre, voir referentiels/models.py:Organisation) : une clé
 * non reconnue ici est simplement ignorée à l'affichage plutôt que de
 * faire échouer la validation Zod de toute la News/Organisation.
 */
export const RESEAU_SOCIAL_PLATEFORMES = [
  'facebook', 'instagram', 'twitter', 'x', 'linkedin', 'youtube', 'whatsapp', 'tiktok',
] as const;
export type ReseauSocialPlateforme = (typeof RESEAU_SOCIAL_PLATEFORMES)[number];

export const OrganisationSchema = z.object({
  id: z.string(),
  nom: z.string(),
  // get_logo renvoie None si pas de fichier logo -> null JSON.
  logo: z.string().nullable().optional(),
  type: z.string(),
  description: z.string().optional(),
  // URLField(blank=True) côté backend -> chaîne vide plutôt que null/absente.
  siteWeb: z.string().optional(),
  // JSONField(default=dict) -> objet libre {plateforme: url}, jamais null.
  // `z.record(z.string())` plutôt que `Partial<Record<ReseauSocialPlateforme, string>>`
  // typé strictement : le backend n'imposant aucune contrainte de clé,
  // une plateforme non reconnue ne doit pas faire échouer le schéma.
  reseauxSociaux: z.record(z.string(), z.string()).optional(),
}).extend(SocleTracabiliteSchema.shape);
export type Organisation = z.infer<typeof OrganisationSchema>;

/** Payload d'écriture JSON (sans logo — voir referentiels.repository.ts
 * pour la variante multipart utilisée à la création). */
export interface OrganisationEcriturePayload {
  nom: string;
  type?: TypeOrganisation;
  description?: string;
  siteWeb?: string;
  reseauxSociaux?: Record<string, string>;
  statut?: StatutCycleVie;
}

export const EtablissementSchema = z.object({
  id: z.string(),
  nom: z.string(),
  province: z.string(),
}).extend(SocleTracabiliteSchema.shape);
export type Etablissement = z.infer<typeof EtablissementSchema>;

export interface EtablissementEcriturePayload {
  nom: string;
  province: string;
  statut?: StatutCycleVie;
}
