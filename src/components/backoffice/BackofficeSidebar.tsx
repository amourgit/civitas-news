// ============================================================
// src/components/backoffice/BackofficeSidebar.tsx
// La navbar « à la Django admin » demandée : chaque table de chaque app
// backend, groupée par app, générée depuis le registre — jamais codée
// en dur table par table. Le filtrage par permission garantit qu'un
// modérateur ne voit dans cette navbar QUE ce qu'il a le droit de gérer
// (ex: le journal d'audit et la gestion de comptes restent réservés à
// ADMIN_UTILISATEUR_GERER/ADMIN_AUDIT_VIEW, donc administrateur).
// ============================================================

import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { groupModelsByApp } from './registry';
import { usePermissions } from '../../lib/permissions/usePermissions';
import { PERMISSIONS } from '../../lib/permissions/permissions.catalog';

export const BackofficeSidebar: React.FC = () => {
  const { can } = usePermissions();

  const groups = groupModelsByApp()
    .map((group) => ({
      ...group,
      models: group.models.filter((m) => can(m.viewPermission ?? PERMISSIONS.BACKOFFICE_ACCESS)),
    }))
    .filter((group) => group.models.length > 0);

  const linkClass = (isActive: boolean) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-[#5B4DFF]/10 text-[#5B4DFF]'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;

  return (
    <nav className="flex flex-col gap-5 w-full sm:w-64 shrink-0" aria-label="Navigation du backoffice">
      <NavLink to="/admin" end className={({ isActive }) => linkClass(isActive)}>
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
              <NavLink key={model.key} to={`/admin/${model.key}`} className={({ isActive }) => linkClass(isActive)}>
                <Icon className="w-4 h-4 shrink-0" />
                {model.labelPlural}
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );
};
