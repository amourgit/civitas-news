// ============================================================
// src/components/backoffice/AdminSidebar.tsx
// Sidebar persistante du backoffice (desktop, md+) -- remplace le
// panneau plein-écran (BackofficeSidebar.tsx, conservé tel quel pour
// le déclenchement mobile depuis AdminTopbar) par une navigation
// TOUJOURS visible façon tableau de bord e-commerce (référence
// utilisateur), glassmorphism + thème clair/sombre.
//
// Contenu généré depuis le MÊME registre que l'ancien menu (voir
// registry/ + usePermissions) : aucune table ni permission codée en
// dur ici, uniquement le rendu.
// ============================================================

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { groupModelsByApp } from './registry';
import { usePermissions } from '../../lib/permissions/usePermissions';
import { PERMISSIONS } from '../../lib/permissions/permissions.catalog';
import { GLASS_CARD } from '../../features/dashboards/glassStyles';

export const AdminSidebar: React.FC = () => {
  const { can } = usePermissions();
  const location = useLocation();

  const groups = groupModelsByApp()
    .map((group) => ({
      ...group,
      models: group.models.filter((m) => can(m.viewPermission ?? PERMISSIONS.BACKOFFICE_ACCESS)),
    }))
    .filter((group) => group.models.length > 0);

  const isDashboardActive = location.pathname === '/admin' || location.pathname === '/admin/';

  return (
    <aside
      className={`hidden md:flex flex-col w-64 shrink-0 h-[calc(100dvh-1.5rem)] sticky top-3 ml-3 ${GLASS_CARD} p-4 overflow-y-auto`}
    >
      <Link to="/" className="flex items-center gap-2 px-1 pb-4 mb-3 border-b border-gray-200/60 dark:border-white/10">
        <img
          src="/images/ChatGPT_Image_10_juin_2026__02_11_18-removebg-preview.png"
          alt="Logo CIVITAS"
          className="w-7 h-7 object-contain"
        />
        <div className="flex items-center gap-1.5 font-display">
          <span className="font-extrabold text-sm tracking-tight text-gray-900 dark:text-white">CIVITAS</span>
          <span className="bg-[#5B4DFF]/10 text-[#5B4DFF] text-[10px] font-black px-1.5 py-0.5 rounded tracking-wider">
            ADMIN
          </span>
        </div>
      </Link>

      <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
        Backoffice
      </p>

      <nav className="flex-1 flex flex-col gap-4">
        <Link
          to="/admin"
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm font-bold transition-colors ${
            isDashboardActive
              ? 'bg-[#5B4DFF] text-white shadow-md shadow-[#5B4DFF]/30'
              : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          Dashboard
        </Link>

        {groups.map((group) => (
          <div key={group.appLabel}>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
              {group.appLabel}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.models.map((model) => {
                const Icon = model.icon;
                const isActive = location.pathname.startsWith(`/admin/${model.key}`);
                return (
                  <Link
                    key={model.key}
                    to={`/admin/${model.key}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#5B4DFF]/10 text-[#5B4DFF]'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{model.labelPlural}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <Link
        to="/"
        className="mt-3 pt-3 border-t border-gray-200/60 dark:border-white/10 px-3 text-xs font-semibold text-gray-400 hover:text-[#5B4DFF] transition-colors"
      >
        ← Retour au site
      </Link>
    </aside>
  );
};

export default AdminSidebar;
