import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Layers,
  Search as SearchIcon,
  BarChart3,
  HelpCircle,
  Sun,
  Moon,
  LogIn,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
} from 'lucide-react';
import { NotchNav, type NotchItemData } from '../ui/notch-nav';
import { useUiStore } from '../../store/ui.store';
import { useNotificationsStore } from '../../store/notifications.store';
import { useAuthStore } from '../../store/auth.store';
import { useBackofficeSidebarStore } from '../../store/backofficeSidebar.store';
import { usePermissions } from '../../lib/permissions/usePermissions';
import { PERMISSIONS } from '../../lib/permissions/permissions.catalog';

// Topbar = NotchNav (voir src/components/ui/notch-nav.tsx, copié tel
// quel — seul le noir de marque y a été remplacé par notre violet).
// Ce fichier ne fait QUE le câblage réel : logo, pages principales
// (items) et TOUTES les icônes d'option qui vivaient dans l'ancienne
// topbar (aide, thème, backoffice, notifications, connexion/profil) —
// reprises telles quelles, juste déplacées dans le nouveau cadre.
const NAV_ITEMS: (NotchItemData & { path: string })[] = [
  { id: 'accueil', label: 'Accueil', icon: Home },
  { id: 'news', label: 'News', icon: Layers },
  { id: 'recherche', label: 'Rechercher', icon: SearchIcon },
  { id: 'statistiques', label: 'Statistiques', icon: BarChart3 },
].map((item, i) => ({ ...item, path: ['/', '/news', '/recherche', '/statistiques'][i] }));

export interface HeaderProps {
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { theme, toggleTheme, openLoginModal } = useUiStore();
  const { unreadCount } = useNotificationsStore();
  // La connexion est STRICTEMENT OPTIONNELLE : aucune route ni requête
  // n'exige de session (voir LoginModal.tsx). `useAuthStore` sert donc
  // uniquement ici à savoir QUOI afficher dans ce coin de la topbar
  // (avatar si connecté, bouton "Se connecter" sinon) -- jamais à
  // bloquer l'accès à quoi que ce soit.
  const { user, isAuthenticated, isHydrating, isAdmin } = useAuthStore();
  const { can } = usePermissions();
  // BackofficeSidebar est un panneau plein-écran unique (voir
  // BackofficeSidebar.tsx) : un seul état isMobileOpen piloté quel que
  // soit le viewport.
  const { isMobileOpen: isBackofficeNavExpanded, toggleMobile: toggleBackofficeNav } = useBackofficeSidebarStore();

  const activeItem = [...NAV_ITEMS]
    .reverse()
    .find((item) => (item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)));
  const activeId = activeItem?.id ?? '';

  const handleActiveChange = (id: string) => {
    const item = NAV_ITEMS.find((i) => i.id === id);
    if (item) navigate(item.path);
  };

  const logo = (
    <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
      <img
        src="/images/ChatGPT_Image_10_juin_2026__02_11_18-removebg-preview.png"
        alt="Logo CIVITAS"
        className="w-7 h-7 object-contain drop-shadow-sm"
      />
      <div className="hidden sm:flex items-center gap-1.5 font-display">
        <span className="font-extrabold text-sm tracking-tight text-white">CIVITAS</span>
        <span className="bg-white/20 text-white text-[10px] font-black px-1.5 py-0.5 rounded tracking-wider border border-white/20">
          NEWS
        </span>
      </div>
    </Link>
  );

  const rightContent = (
    <div className="flex items-center gap-1 sm:gap-1.5">
      {/* Help icon */}
      <button
        type="button"
        className="hidden sm:flex p-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/15 transition-colors"
        title="Aide & Support"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {/* Theme switcher */}
      <button
        type="button"
        onClick={toggleTheme}
        className="flex p-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/15 transition-colors"
        title="Changer de thème"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* Ouverture/fermeture de la navigation backoffice (voir
          Header.tsx historique / BackofficeSidebar.tsx) — visible
          uniquement pour les admins. */}
      {isAdmin && (
        <button
          type="button"
          onClick={toggleBackofficeNav}
          aria-label={isBackofficeNavExpanded ? 'Fermer la navigation du backoffice' : 'Ouvrir la navigation du backoffice'}
          title="Navigation du backoffice"
          className="flex p-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/15 transition-colors"
        >
          {isBackofficeNavExpanded ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>
      )}

      {/* Backoffice — icône visible uniquement pour les
          modérateurs/administrateurs (voir permissions.catalog.ts :
          BACKOFFICE_ACCESS/ADMIN_ACCESS), même niveau d'accès que
          /admin lui-même (voir BackofficeLayout). */}
      {isAuthenticated && (can(PERMISSIONS.BACKOFFICE_ACCESS) || can(PERMISSIONS.ADMIN_ACCESS)) && (
        <Link
          to="/admin"
          className="flex p-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/15 transition-colors"
          title="Backoffice"
        >
          <ShieldCheck className="w-4 h-4" />
        </Link>
      )}

      {/* Notifications Trigger */}
      <Link
        to="/notifications"
        className="relative p-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/15 transition-colors flex items-center justify-center"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-[#5B4DFF]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>

      {/* Connexion / Profil — la topbar est la source de vérité de
          l'état d'authentification, affichée sur toutes les pages
          (voir App.tsx). Pendant l'hydratation initiale (lecture du
          token stocké, voir auth.store.ts), on affiche un espace
          neutre plutôt que de flasher "Se connecter" puis basculer
          vers l'avatar une fois la session restaurée. */}
      {isHydrating ? (
        <div className="w-6 h-6 rounded-full bg-white/15 animate-pulse shrink-0" aria-hidden="true" />
      ) : isAuthenticated ? (
        <Link
          to="/profil"
          className="flex items-center justify-center w-6 h-6 rounded-full overflow-hidden border border-white/30 hover:border-white/70 transition-colors shrink-0"
          title={user.nomAffiche}
        >
          {user.avatar ? (
            <img src={user.avatar} alt={user.nomAffiche} className="w-full h-full object-cover" />
          ) : (
            <span className="w-full h-full flex items-center justify-center bg-white/15 text-white text-[10px] font-bold uppercase">
              {user.nomAffiche.charAt(0)}
            </span>
          )}
        </Link>
      ) : (
        <button
          type="button"
          onClick={openLoginModal}
          className="flex p-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/15 transition-colors"
          title="Se connecter"
        >
          <LogIn className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  return (
    <NotchNav
      items={NAV_ITEMS}
      activeId={activeId}
      onActiveChange={handleActiveChange}
      logo={logo}
      rightContent={rightContent}
    >
      {children}
    </NotchNav>
  );
};
