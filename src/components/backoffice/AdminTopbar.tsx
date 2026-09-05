// ============================================================
// src/components/backoffice/AdminTopbar.tsx
// Topbar du shell admin (voir AdminSidebar.tsx pour la nav
// persistante desktop). Recherche = raccourci réel vers une table du
// registre (pas un champ décoratif) ; cloche = compteur réel de
// notifications (useNotificationsStore, déjà utilisé par
// NotificationsPage) ; profil = ProfileDropdown existant, réutilisé
// tel quel (déjà en portail, déjà câblé déconnexion/paramètres).
// ============================================================

import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu } from 'lucide-react';
import { groupModelsByApp } from './registry';
import { usePermissions } from '../../lib/permissions/usePermissions';
import { PERMISSIONS } from '../../lib/permissions/permissions.catalog';
import { useBackofficeSidebarStore } from '../../store/backofficeSidebar.store';
import { useNotificationsStore } from '../../store/notifications.store';
import { ProfileDropdown } from '../layout/ProfileDropdown';
import { ThemeToggleSwitch } from '../../features/dashboards/ThemeToggleSwitch';
import { GLASS_CARD } from '../../features/dashboards/glassStyles';

export const AdminTopbar: React.FC = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { toggleMobile } = useBackofficeSidebarStore();
  const { unreadCount } = useNotificationsStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const allModels = useMemo(
    () =>
      groupModelsByApp()
        .flatMap((g) => g.models)
        .filter((m) => can(m.viewPermission ?? PERMISSIONS.BACKOFFICE_ACCESS)),
    [can]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allModels.filter((m) => m.labelPlural.toLowerCase().includes(q)).slice(0, 6);
  }, [allModels, query]);

  const goTo = (key: string) => {
    setQuery('');
    inputRef.current?.blur();
    navigate(`/admin/${key}`);
  };

  return (
    <header className={`sticky top-3 z-30 flex items-center gap-3 px-4 py-3 ${GLASS_CARD}`}>
      <button
        type="button"
        onClick={toggleMobile}
        className="md:hidden p-2 -ml-1 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/5"
        aria-label="Ouvrir la navigation du backoffice"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && results[0]) goTo(results[0].key);
          }}
          placeholder="Rechercher une table du backoffice…"
          className="w-full pl-9 pr-3 py-2 rounded-2xl text-sm bg-white/60 dark:bg-white/[0.06] border border-gray-200/60 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/40"
        />
        {results.length > 0 && (
          <div className={`absolute left-0 right-0 mt-1.5 py-1.5 z-40 ${GLASS_CARD} !rounded-2xl`}>
            {results.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => goTo(m.key)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-white/10 text-left"
                >
                  <Icon className="w-4 h-4 text-[#5B4DFF] shrink-0" />
                  {m.labelPlural}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-white/5"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <ThemeToggleSwitch />

        <ProfileDropdown />
      </div>
    </header>
  );
};

export default AdminTopbar;
