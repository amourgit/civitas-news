// ============================================================
// src/lib/permissions/hasPermission.ts
// Fonctions pures de résolution des permissions — utilisables
// aussi bien dans des composants React que dans des services
// (repositories, guards de route, etc.).
// ============================================================

import type { Utilisateur } from '../../types/models/user.types';
import { ROLE_PERMISSIONS } from './rolePermissions';
import type { Permission } from './permissions.catalog';

export function hasPermission(user: Utilisateur | null | undefined, permission: Permission): boolean {
  const role = user?.role ?? 'anonyme';
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(user: Utilisateur | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(user, permission));
}

export function hasAllPermissions(user: Utilisateur | null | undefined, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(user, permission));
}

/**
 * Résout une permission à portée variable ("own" vs "any") en fonction du
 * propriétaire de la ressource concernée.
 *
 * Exemple : `canOnResource(user, 'news:edit', news.auteur.id)` vérifie
 * d'abord `news:edit:any`, puis, si l'utilisateur est le propriétaire,
 * `news:edit:own`.
 */
export function canOnResource(
  user: Utilisateur | null | undefined,
  baseAction: 'news:edit' | 'news:delete' | 'commentaire:delete',
  resourceOwnerId: string | undefined
): boolean {
  const anyPermission = `${baseAction}:any` as Permission;
  if (hasPermission(user, anyPermission)) return true;

  if (user && resourceOwnerId && user.id === resourceOwnerId) {
    const ownPermission = `${baseAction}:own` as Permission;
    return hasPermission(user, ownPermission);
  }

  return false;
}
