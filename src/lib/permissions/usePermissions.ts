// ============================================================
// src/lib/permissions/usePermissions.ts
// Hook React d'accès aux permissions de l'utilisateur courant.
// S'appuie sur le store d'authentification existant (store/auth.store.ts)
// — aucune dépendance nouvelle, juste une couche de lecture fine.
// ============================================================

import { useAuthStore } from '../../store/auth.store';
import { hasPermission, hasAnyPermission, hasAllPermissions, canOnResource } from './hasPermission';
import type { Permission } from './permissions.catalog';

export function usePermissions() {
  const { user } = useAuthStore();

  return {
    role: user.role,
    can: (permission: Permission) => hasPermission(user, permission),
    canAny: (permissions: Permission[]) => hasAnyPermission(user, permissions),
    canAll: (permissions: Permission[]) => hasAllPermissions(user, permissions),
    canOnResource: (
      baseAction: 'news:edit' | 'news:delete' | 'commentaire:delete',
      resourceOwnerId: string | undefined
    ) => canOnResource(user, baseAction, resourceOwnerId),
  };
}
