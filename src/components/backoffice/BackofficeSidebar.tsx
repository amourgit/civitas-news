// ============================================================
// src/components/backoffice/BackofficeSidebar.tsx
// Reprend la structure visuelle d'un design partagé (badge de marque en
// tête, barre de recherche qui se réduit en icône, groupes repliables,
// pied avec avatar), mais entièrement recâblée sur les VRAIES données du
// backoffice : le registre de modèles (voir registry/), les VRAIES
// permissions, les VRAIES routes /admin/:modelKey, et le VRAI
// utilisateur connecté. Aucun contenu de démonstration conservé -- pas
// de sous-menus fictifs : les groupes repliables affichent les tables
// réelles de chaque app, rien d'autre.
//
// Deux modes de rendu partagent le même contenu :
// - Desktop (sm et plus) : colonne statique, repliable en rail d'icônes.
// - Mobile : tiroir hors-écran (position fixed, glisse depuis la
//   gauche), même convention d'animation que components/ui/Modal.tsx.
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, X, Search, ChevronDown, ChevronsLeft, ChevronsRight, ShieldCheck, User as UserIcon } from 'lucide-react';
import { groupModelsByApp } from './registry';
import { usePermissions } from '../../lib/permissions/usePermissions';
import { PERMISSIONS } from '../../lib/permissions/permissions.catalog';
import { useAuthStore } from '../../store/auth.store';

const linkClass = (isActive: boolean, isCollapsed: boolean) =>
  `flex items-center gap-2.5 rounded-xl text-sm font-semibold transition-colors ${
    isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'
  } ${
    isActive
      ? 'bg-[#5B4DFF]/10 text-[#5B4DFF]'
      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
  }`;

/** Petit badge de marque -- remplace le logo/texte de démonstration par
 * l'identité réelle du backoffice CIVITAS. */
function BrandBadge({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <div className="flex items-center gap-2 px-1 py-1 min-w-0">
      <div className="w-8 h-8 rounded-xl bg-[#5B4DFF] flex items-center justify-center shrink-0">
        <ShieldCheck className="w-4.5 h-4.5 text-white" />
      </div>
      {!isCollapsed && (
        <span className="text-sm font-extrabold text-gray-900 dark:text-white font-display truncate">
          CIVITAS Backoffice
        </span>
      )}
    </div>
  );
}

/** Recherche en temps réel dans les tables du backoffice -- filtre la
 * VRAIE liste de modèles affichée plus bas, aucune donnée fictive. */
function SidebarSearch({
  value,
  onChange,
  isCollapsed,
  onExpandRequest,
}: {
  value: string;
  onChange: (v: string) => void;
  isCollapsed: boolean;
  onExpandRequest: () => void;
}) {
  if (isCollapsed) {
    return (
      <button
        onClick={onExpandRequest}
        aria-label="Rechercher dans le backoffice"
        className="flex items-center justify-center w-full h-9 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Search className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="relative w-full">
      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher une table..."
        className="w-full h-9 pl-9 pr-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#5B4DFF]/40"
      />
    </div>
  );
}

interface SidebarLinksProps {
  isCollapsed?: boolean;
  onNavigate?: () => void;
}

/** Contenu de la navigation, partagé entre le rendu desktop et le tiroir mobile. */
const SidebarLinks: React.FC<SidebarLinksProps> = ({ isCollapsed = false, onNavigate }) => {
  const { can } = usePermissions();
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    return groupModelsByApp()
      .map((group) => ({
        ...group,
        models: group.models
          .filter((m) => can(m.viewPermission ?? PERMISSIONS.BACKOFFICE_ACCESS))
          .filter((m) => !query || m.labelPlural.toLowerCase().includes(query) || group.appLabel.toLowerCase().includes(query)),
      }))
      .filter((group) => group.models.length > 0);
  }, [can, search]);

  const toggleGroup = (appLabel: string) =>
    setExpandedGroups((prev) => ({ ...prev, [appLabel]: prev[appLabel] === false ? true : false }));

  return (
    <div className="flex flex-col gap-4 w-full">
      {!isCollapsed && (
        <SidebarSearch value={search} onChange={setSearch} isCollapsed={false} onExpandRequest={() => {}} />
      )}

      <div className="flex flex-col gap-1">
        <NavLink to="/admin" end onClick={onNavigate} className={({ isActive }) => linkClass(isActive, isCollapsed)} title="Tableau de bord">
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          {!isCollapsed && 'Tableau de bord'}
        </NavLink>
      </div>

      {groups.map((group) => {
        // Replié seulement si l'utilisateur l'a explicitement replié
        // (par défaut : tout ouvert) -- une recherche active force
        // toujours l'affichage des résultats, peu importe cet état.
        const isOpen = search.trim() ? true : expandedGroups[group.appLabel] !== false;
        return (
          <div key={group.appLabel} className="flex flex-col gap-1">
            {isCollapsed ? (
              <div className="h-px bg-gray-100 dark:bg-gray-800 mx-1 my-1" aria-hidden="true" />
            ) : (
              <button
                onClick={() => toggleGroup(group.appLabel)}
                className="flex items-center justify-between px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <span>{group.appLabel}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
              </button>
            )}
            {(isCollapsed || isOpen) &&
              group.models.map((model) => {
                const Icon = model.icon;
                return (
                  <NavLink
                    key={model.key}
                    to={`/admin/${model.key}`}
                    onClick={onNavigate}
                    className={({ isActive }) => linkClass(isActive, isCollapsed)}
                    title={model.labelPlural}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!isCollapsed && model.labelPlural}
                  </NavLink>
                );
              })}
          </div>
        );
      })}

      {!isCollapsed && groups.length === 0 && search.trim() && (
        <p className="px-3 text-xs text-gray-400 italic">Aucune table ne correspond à « {search} ».</p>
      )}
    </div>
  );
};

/** Pied de sidebar : le VRAI utilisateur connecté (avatar, nom), lien
 * vers son profil public. */
function SidebarFooter({ isCollapsed }: { isCollapsed: boolean }) {
  const { user } = useAuthStore();
  if (!user) return null;

  return (
    <NavLink
      to="/profil"
      className={`flex items-center gap-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
        isCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'
      }`}
      title={user.nomAffiche}
    >
      {user.avatar ? (
        <img src={user.avatar} alt={user.nomAffiche} className="w-7 h-7 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
          <UserIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-300" />
        </div>
      )}
      {!isCollapsed && (
        <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">{user.nomAffiche}</span>
      )}
    </NavLink>
  );
}

export interface BackofficeSidebarProps {
  /** Tiroir mobile ouvert ? (ignoré au-delà du breakpoint `sm`, où la navbar est toujours statique et visible). */
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const BackofficeSidebar: React.FC<BackofficeSidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      {/* Desktop — colonne statique, toujours visible, repliable en rail d'icônes. */}
      <nav
        className={`hidden sm:flex flex-col shrink-0 border-r border-gray-100 dark:border-gray-800/80 transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
        aria-label="Navigation du backoffice"
      >
        <div className="flex items-center justify-between gap-2 px-2 py-3">
          <BrandBadge isCollapsed={isCollapsed} />
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-1">
          <SidebarLinks isCollapsed={isCollapsed} />
        </div>

        <div className="px-2 py-2 border-t border-gray-100 dark:border-gray-800/80 flex flex-col gap-1">
          <SidebarFooter isCollapsed={isCollapsed} />
          <button
            onClick={() => setIsCollapsed((v) => !v)}
            aria-label={isCollapsed ? 'Déplier la navigation' : 'Replier la navigation'}
            className={`flex items-center gap-2 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
              isCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'
            }`}
          >
            {isCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
            {!isCollapsed && 'Replier'}
          </button>
        </div>
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
                <BrandBadge isCollapsed={false} />
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
              <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800">
                <SidebarFooter isCollapsed={false} />
              </div>
            </motion.aside>
          </React.Fragment>
        )}
      </AnimatePresence>
    </>
  );
};
