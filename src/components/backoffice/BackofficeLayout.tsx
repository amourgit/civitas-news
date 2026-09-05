// ============================================================
// src/components/backoffice/BackofficeLayout.tsx
// Shell complet du backoffice (sidebar persistante desktop +
// topbar + fond dégradé propre à /admin), plus l'écran d'accès
// refusé. Remplace l'ancienne mise en page qui se contentait de
// rendre l'Outlet à l'intérieur du shell public (Header/SideContent/
// MobileDock) -- voir App.tsx pour la scission de routage qui rend
// ce shell EN DEHORS du shell public.
// ============================================================

import React from 'react';
import { Outlet } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { usePermissions } from '../../lib/permissions/usePermissions';
import { PERMISSIONS } from '../../lib/permissions/permissions.catalog';
import { useAuthStore } from '../../store/auth.store';
import { useBackofficeSidebarStore } from '../../store/backofficeSidebar.store';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';
import { BackofficeSidebar } from './BackofficeSidebar';
import { GLASS_PAGE_BACKGROUND } from '../../features/dashboards/glassStyles';

export const BackofficeLayout: React.FC = () => {
  const { can } = usePermissions();
  const { isHydrating } = useAuthStore();
  // Volet plein écran (voir BackofficeSidebar.tsx) : navigation mobile
  // de secours, déclenchée par le hamburger de AdminTopbar.
  const { isMobileOpen, closeMobile } = useBackofficeSidebarStore();

  if (isHydrating) return null;

  if (!can(PERMISSIONS.BACKOFFICE_ACCESS) && !can(PERMISSIONS.ADMIN_ACCESS)) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${GLASS_PAGE_BACKGROUND}`}>
        <div className="flex flex-col items-center text-center gap-3 px-4">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
            <ShieldOff className="w-7 h-7" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Accès réservé</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            Le backoffice est réservé aux modérateurs et administrateurs de la plateforme.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${GLASS_PAGE_BACKGROUND}`}>
      <AdminSidebar />
      <div className="flex-1 min-w-0 flex flex-col px-3 pb-6 gap-3">
        <AdminTopbar />
        <main className="flex-1 min-w-0 w-full max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>
      {/* Repli mobile : le volet plein écran existant, déclenché depuis le hamburger de AdminTopbar. */}
      <BackofficeSidebar isMobileOpen={isMobileOpen} onCloseMobile={closeMobile} />
    </div>
  );
};

export default BackofficeLayout;
