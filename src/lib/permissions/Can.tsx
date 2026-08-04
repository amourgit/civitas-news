// ============================================================
// src/lib/permissions/Can.tsx
// Garde déclarative pour conditionner l'affichage d'un élément UI
// à une permission. Usage :
//
//   <Can permission={PERMISSIONS.NEWS_CREATE}>
//     <Button>Publier une news</Button>
//   </Can>
//
//   <Can permission={PERMISSIONS.ADMIN_ACCESS} fallback={<AccesRefuse />}>
//     <AdminDashboardPage />
//   </Can>
// ============================================================

import type { ReactNode } from 'react';
import { usePermissions } from './usePermissions';
import type { Permission } from './permissions.catalog';

interface CanProps {
  permission: Permission;
  /** Contenu affiché si la permission n'est pas accordée (par défaut : rien). */
  fallback?: ReactNode;
  children: ReactNode;
}

export function Can({ permission, fallback = null, children }: CanProps) {
  const { can } = usePermissions();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}
