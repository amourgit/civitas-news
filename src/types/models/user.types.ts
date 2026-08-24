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
  role: RoleUtilisateurSchema,
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

export const OrganisationSchema = z.object({
  id: z.string(),
  nom: z.string(),
  // get_logo renvoie None si pas de fichier logo -> null JSON.
  logo: z.string().nullable().optional(),
  type: z.string(),
  description: z.string().optional(),
}).extend(SocleTracabiliteSchema.shape);
export type Organisation = z.infer<typeof OrganisationSchema>;

/** Payload d'écriture JSON (sans logo — voir referentiels.repository.ts
 * pour la variante multipart utilisée à la création). */
export interface OrganisationEcriturePayload {
  nom: string;
  type?: TypeOrganisation;
  description?: string;
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
