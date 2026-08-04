// ============================================================
// src/lib/permissions/rolePermissions.ts
// Association Rôle -> ensemble de permissions accordées.
// Chaque rôle hérite explicitement des permissions du rôle
// "inférieur" pour éviter les oublis (pas de magie implicite).
// ============================================================

import type { RoleUtilisateur } from '../../types/models/user.types';
import { PERMISSIONS, type Permission } from './permissions.catalog';

const ANONYME: Permission[] = [PERMISSIONS.NEWS_VIEW, PERMISSIONS.COMMENTAIRE_VIEW, PERMISSIONS.SONDAGE_VIEW];

const ETUDIANT: Permission[] = [
  ...ANONYME,
  PERMISSIONS.NEWS_REACT,
  PERMISSIONS.COMMENTAIRE_CREATE,
  PERMISSIONS.COMMENTAIRE_DELETE_OWN,
  PERMISSIONS.SONDAGE_VOTE,
  PERMISSIONS.LIEN_CREATE,
  PERMISSIONS.NOTIFICATION_MANAGE_OWN,
];

const ORGANISATION: Permission[] = [
  ...ETUDIANT,
  PERMISSIONS.NEWS_CREATE,
  PERMISSIONS.NEWS_EDIT_OWN,
  PERMISSIONS.NEWS_DELETE_OWN,
  PERMISSIONS.SONDAGE_CREATE,
  PERMISSIONS.STATISTIQUES_VIEW,
];

const MODERATEUR: Permission[] = [
  ...ORGANISATION,
  PERMISSIONS.NEWS_PIN,
  PERMISSIONS.NEWS_PUBLISH,
  PERMISSIONS.COMMENTAIRE_DELETE_ANY,
  PERMISSIONS.COMMENTAIRE_PIN,
  PERMISSIONS.COMMENTAIRE_MODERATE,
  PERMISSIONS.ADMIN_ACCESS,
  PERMISSIONS.ADMIN_SIGNALEMENT_TRAITER,
  PERMISSIONS.LIEN_DELETE,
];

const ADMINISTRATEUR: Permission[] = [
  ...MODERATEUR,
  PERMISSIONS.NEWS_EDIT_ANY,
  PERMISSIONS.NEWS_DELETE_ANY,
  PERMISSIONS.ADMIN_AUDIT_VIEW,
  PERMISSIONS.ADMIN_UTILISATEUR_GERER,
];

export const ROLE_PERMISSIONS: Record<RoleUtilisateur, Permission[]> = {
  anonyme: ANONYME,
  etudiant: ETUDIANT,
  organisation: ORGANISATION,
  moderateur: MODERATEUR,
  administrateur: ADMINISTRATEUR,
};
