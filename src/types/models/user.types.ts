// ============================================================
// src/types/models/user.types.ts
// Domaine Utilisateur — schéma canonique (Zod) + types dérivés.
//
// Note backend (Backend-Core-Base, branche civitas-news) :
// le modèle User Django actuel ne porte que
// { id, username, email, first_name, last_name, is_active, date_joined }.
// Les champs enrichis ci-dessous (avatar, role, badges, stats,
// etablissement) sont la cible fonctionnelle attendue par le
// frontend — ils nécessiteront une extension du serializer/modèle
// côté backend (profil utilisateur) lors de la prochaine phase.
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
  avatar: z.string().optional(),
  role: RoleUtilisateurSchema,
  etablissement: z.string().optional(),
  email: z.string().optional(),
  badges: z.array(BadgeSchema),
  stats: UtilisateurStatsSchema,
});
export type Utilisateur = z.infer<typeof UtilisateurSchema>;

export const OrganisationSchema = z.object({
  id: z.string(),
  nom: z.string(),
  logo: z.string().optional(),
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
