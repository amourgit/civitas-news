// ============================================================
// src/components/backoffice/BackofficeSidebar.tsx
// La navbar « à la Django admin » demandée : chaque table de chaque app
// backend, groupée par app, générée depuis le registre — jamais codée
// en dur table par table. Le filtrage par permission garantit qu'un
// modérateur ne voit dans cette navbar QUE ce qu'il a le droit de gérer
// (ex: le journal d'audit et la gestion de comptes restent réservés à
// ADMIN_UTILISATEUR_GERER/ADMIN_AUDIT_VIEW, donc administrateur).
//
// Deux modes de rendu partagent le même contenu (<SidebarLinks>) :
// - Desktop (sm et plus) : colonne statique, toujours visible.
// - Mobile : tiroir hors-écran (position fixed, glisse depuis la
//   gauche) ouvert/fermé par BackofficeLayout, même convention
//   d'animation que components/ui/Modal.tsx (motion/react, backdrop,
//   verrouillage du scroll du body pendant l'ouverture).
// ============================================================

import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, X } from 'lucide-react';
import { groupModelsByApp } from './registry';
import { usePermissions } from '../../lib/permissions/usePermissions';
import { PERMISSIONS } from '../../lib/permissions/permissions.catalog';

const linkClass = (isActive: boolean) =>
  `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
    isActive
      ? 'bg-[#5B4DFF]/10 text-[#5B4DFF]'
      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
  }`;

interface SidebarLinksProps {
  onNavigate?: () => void;
}

/** Contenu de la navigation, partagé entre le rendu desktop et le tiroir mobile. */
const SidebarLinks: React.FC<SidebarLinksProps> = ({ onNavigate }) => {
  const { can } = usePermissions();

  const groups = groupModelsByApp()
    .map((group) => ({
      ...group,
      models: group.models.filter((m) => can(m.viewPermission ?? PERMISSIONS.BACKOFFICE_ACCESS)),
    }))
    .filter((group) => group.models.length > 0);

  return (
    <div className="flex flex-col gap-5">
      <NavLink to="/admin" end onClick={onNavigate} className={({ isActive }) => linkClass(isActive)}>
        <LayoutDashboard className="w-4 h-4 shrink-0" />
        Tableau de bord
      </NavLink>

      {groups.map((group) => (
        <div key={group.appLabel} className="flex flex-col gap-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {group.appLabel}
          </p>
          {group.models.map((model) => {
            const Icon = model.icon;
            return (
              <NavLink
                key={model.key}
                to={`/admin/${model.key}`}
                onClick={onNavigate}
                className={({ isActive }) => linkClass(isActive)}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {model.labelPlural}
              </NavLink>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export interface BackofficeSidebarProps {
  /** Tiroir mobile ouvert ? (ignoré au-delà du breakpoint `sm`, où la navbar est toujours statique et visible). */
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const BackofficeSidebar: React.FC<BackofficeSidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  // Verrouille le scroll du body pendant que le tiroir est ouvert — même
  // convention que components/ui/Modal.tsx.
  useEffect(() => {
    if (!isMobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isMobileOpen]);

  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  return (
    <>
      {/* Desktop — colonne statique, toujours visible, jamais de tiroir. */}
      <nav className="hidden sm:flex flex-col w-64 shrink-0" aria-label="Navigation du backoffice">
        <SidebarLinks />
      </nav>

      {/* Mobile — tiroir hors-écran + fond assombri, glisse depuis la gauche. */}
      <AnimatePresence>
        {isMobileOpen && (
          <React.Fragment key="backoffice-mobile-drawer">
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="sm:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px]"
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation du backoffice"
              className="sm:hidden fixed inset-y-0 left-0 z-50 w-[82%] max-w-xs bg-white dark:bg-[#0E1338] shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800">
                <span className="text-sm font-extrabold text-gray-900 dark:text-white font-display">Backoffice</span>
                <button
                  onClick={onCloseMobile}
                  aria-label="Fermer la navigation"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-4">
                <SidebarLinks onNavigate={onCloseMobile} />
              </div>
            </motion.aside>
          </React.Fragment>
        )}
      </AnimatePresence>
    </>
  );
};
