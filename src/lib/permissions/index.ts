// ============================================================
// src/lib/permissions/index.ts
// Point d'entrée unique du module de permissions frontend.
// ============================================================

export { PERMISSIONS } from './permissions.catalog';
export type { Permission } from './permissions.catalog';
export { ROLE_PERMISSIONS } from './rolePermissions';
export { hasPermission, hasAnyPermission, hasAllPermissions, canOnResource } from './hasPermission';
export { usePermissions } from './usePermissions';
export { Can } from './Can';
