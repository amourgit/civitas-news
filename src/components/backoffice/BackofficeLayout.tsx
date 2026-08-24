// ============================================================
// src/components/backoffice/BackofficeLayout.tsx
// ============================================================

import React from 'react';
import { Outlet } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { BackofficeSidebar } from './BackofficeSidebar';
import { usePermissions } from '../../lib/permissions/usePermissions';
import { PERMISSIONS } from '../../lib/permissions/permissions.catalog';
import { useAuthStore } from '../../store/auth.store';

export const BackofficeLayout: React.FC = () => {
  const { can } = usePermissions();
  const { isHydrating } = useAuthStore();

  if (isHydrating) return null;

  if (!can(PERMISSIONS.BACKOFFICE_ACCESS) && !can(PERMISSIONS.ADMIN_ACCESS)) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 gap-3">
        <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
          <ShieldOff className="w-7 h-7" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Accès réservé</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Le backoffice est réservé aux modérateurs et administrateurs de la plateforme.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-6 w-full">
      <BackofficeSidebar />
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
};
