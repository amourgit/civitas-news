// ============================================================
// src/lib/permissions/rolePermissions.ts
// Association Rôle -> ensemble de permissions accordées.
// Chaque rôle hérite explicitement des permissions du rôle
// "inférieur" pour éviter les oublis (pas de magie implicite).
// ============================================================

import type { RoleUtilisateur } from '../../types/models/user.types';
import { PERMISSIONS, type Permission } from './permissions.catalog';

const ANONYME: Permission[] = [
  PERMISSIONS.NEWS_VIEW, PERMISSIONS.COMMENTAIRE_VIEW, PERMISSIONS.SONDAGE_VIEW,
  // Les référentiels (Catégories/Organisations/Établissements) sont en
  // LECTURE publique côté backend (LectureLibreEcritureModerateur —
  // voir referentiels/api/v1/views.py) : nécessaire ne serait-ce que
  // pour peupler les sélecteurs du formulaire de création de News.
  PERMISSIONS.REFERENTIEL_VIEW,
];

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
  // Backoffice — même niveau que les droits de modération backend
  // (common/permissions.py:ROLES_MODERATION = moderateur + administrateur)
  // sur lesquels s'appuient les endpoints correspondants.
  PERMISSIONS.BACKOFFICE_ACCESS,
  PERMISSIONS.REFERENTIEL_MANAGE,
  PERMISSIONS.BACKOFFICE_NEWS_MANAGE,
  PERMISSIONS.BACKOFFICE_COMMENTAIRE_MANAGE,
  PERMISSIONS.BACKOFFICE_SONDAGE_MANAGE,
  PERMISSIONS.BACKOFFICE_LIEN_MANAGE,
  PERMISSIONS.BACKOFFICE_NOTIFICATION_VIEW,
  PERMISSIONS.BACKOFFICE_SIGNALEMENT_MANAGE,
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
