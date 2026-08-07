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

export const OrganisationSchema = z.object({
  id: z.string(),
  nom: z.string(),
  // get_logo renvoie None si pas de fichier logo -> null JSON.
  logo: z.string().nullable().optional(),
  type: z.string(),
  description: z.string().optional(),
});
export type Organisation = z.infer<typeof OrganisationSchema>;

export const EtablissementSchema = z.object({
  id: z.string(),
  nom: z.string(),
  province: z.string(),
});
export type Etablissement = z.infer<typeof EtablissementSchema>;
