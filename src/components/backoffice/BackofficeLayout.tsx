// ============================================================
// src/components/backoffice/BackofficeLayout.tsx
// ============================================================

import React, { useEffect } from 'react';
import { Outlet, useParams, useLocation } from 'react-router-dom';
import { Menu, ShieldOff } from 'lucide-react';
import { BackofficeSidebar } from './BackofficeSidebar';
import { getModel } from './registry';
import { usePermissions } from '../../lib/permissions/usePermissions';
import { PERMISSIONS } from '../../lib/permissions/permissions.catalog';
import { useAuthStore } from '../../store/auth.store';
import { useBackofficeSidebarStore } from '../../store/backofficeSidebar.store';

export const BackofficeLayout: React.FC = () => {
  const { can } = usePermissions();
  const { isHydrating } = useAuthStore();
  const { modelKey } = useParams<{ modelKey?: string }>();
  const location = useLocation();
  const { isMobileOpen: isMobileNavOpen, openMobile: openMobileNav, closeMobile: closeMobileNav } = useBackofficeSidebarStore();

  // Referme le tiroir mobile à chaque changement de route (ex: après un
  // clic sur un lien, ou une navigation "Ajouter"/"Retour" déclenchée
  // par le contenu plutôt que par la navbar elle-même).
  useEffect(() => {
    closeMobileNav();
  }, [location.pathname]);

  if (isHydrating) return null;

  if (!can(PERMISSIONS.BACKOFFICE_ACCESS) && !can(PERMISSIONS.ADMIN_ACCESS)) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 gap-3 px-4">
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

  const currentModel = getModel(modelKey);

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full min-w-0">
      {/* Barre supérieure mobile uniquement — la navbar desktop (colonne
          statique, voir BackofficeSidebar) affiche déjà le contexte en
          continu, donc pas besoin de cette barre au-delà de `sm`.
          PAS de `sticky` ici : le Header global de l'app est déjà
          `sticky top-0 z-40` (voir components/layout/Header.tsx) — un
          second élément `sticky top-0` entrerait en collision avec lui
          au scroll (même position d'accroche, chevauchement visuel). */}
      <div className="sm:hidden flex items-center gap-3 -mx-2 px-2 py-2 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={openMobileNav}
          aria-label="Ouvrir la navigation du backoffice"
          className="p-2 rounded-xl bg-white dark:bg-[#1A1F4D] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 shrink-0"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>
        <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
          {currentModel ? currentModel.labelPlural : 'Backoffice'}
        </span>
      </div>

      <BackofficeSidebar isMobileOpen={isMobileNavOpen} onCloseMobile={closeMobileNav} />

      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
};
