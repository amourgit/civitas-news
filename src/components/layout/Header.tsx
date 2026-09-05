import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Layers,
  Search as SearchIcon,
  BarChart3,
  HelpCircle,
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import { NotchNav, type NotchItemData } from '../ui/notch-nav';
import { ProfileDropdown } from './ProfileDropdown';
import { BackofficeSidebar } from '../backoffice/BackofficeSidebar';
import { useUiStore } from '../../store/ui.store';
import { useAuthStore } from '../../store/auth.store';
import { useBackofficeSidebarStore } from '../../store/backofficeSidebar.store';
import { usePermissions } from '../../lib/permissions/usePermissions';
import { PERMISSIONS } from '../../lib/permissions/permissions.catalog';

// Topbar = NotchNav (voir src/components/ui/notch-nav.tsx). Ce fichier
// ne fait QUE le câblage réel : logo, pages principales (items), et
// les icônes d'option (aide, backoffice, connexion/profil), reprises
// telles quelles. Depuis la refonte structurelle de NotchNav, le bloc
// droit est scindé en deux pièces détachées : `rightContent` (aide +
// lien backoffice + connexion/profil, groupées dans un même cadre) et
// `rightAction` (bascule sidebar backoffice, toujours seule dans son
// propre cadre, au coin réel de l'écran) — visibles à toutes les
// tailles (desktop, tablette, mobile).
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

  const { openLoginModal } = useUiStore();
  // La connexion est STRICTEMENT OPTIONNELLE : aucune route ni requête
  // n'exige de session (voir LoginModal.tsx). `useAuthStore` sert donc
  // uniquement ici à savoir QUOI afficher dans ce coin de la topbar
  // (avatar si connecté, bouton "Se connecter" sinon) -- jamais à
  // bloquer l'accès à quoi que ce soit.
  const { isAuthenticated, isHydrating, isAdmin } = useAuthStore();
  const { can } = usePermissions();
  // BackofficeSidebar est un panneau plein-écran unique (voir
  // BackofficeSidebar.tsx) : un seul état isMobileOpen piloté quel que
  // soit le viewport.
  const {
    isMobileOpen: isBackofficeNavExpanded,
    toggleMobile: toggleBackofficeNav,
    closeMobile: closeBackofficeNav,
  } = useBackofficeSidebarStore();

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
        className="w-7 h-7 sm:w-7 sm:h-7 object-contain drop-shadow-sm"
      />
      <div className="flex items-center gap-1.5 font-display">
        <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white">CIVITAS</span>
        <span className="bg-white/20 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded tracking-wider border border-white/20">
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

      {/* Connexion / Profil — la topbar est la source de vérité de
          l'état d'authentification, affichée sur toutes les pages
          (voir App.tsx). Pendant l'hydratation initiale (lecture du
          token stocké, voir auth.store.ts), on affiche un espace
          neutre plutôt que de flasher "Se connecter" puis basculer
          vers l'avatar une fois la session restaurée. */}
      {isHydrating ? (
        <div className="w-6 h-6 rounded-full bg-white/15 animate-pulse shrink-0" aria-hidden="true" />
      ) : isAuthenticated ? (
        <ProfileDropdown />
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

  // Pièce détachée, seule dans son propre cadre (voir notch-nav.tsx :
  // `rightAction` occupe toujours le coin réel de l'écran) — bascule
  // le panneau BackofficeSidebar monté ci-dessous, réservée aux
  // admins. Le déclencheur reprend le hamburger de la référence
  // (BackofficeSidebar.tsx : trois barres qui pivotent en croix) avec
  // exactement sa logique et son animation (mêmes classes de
  // transform/opacity, même durée 300ms) — seule la mise en boîte
  // change : `bg-current` + réduction d'échelle (scale-50) pour
  // s'intégrer dans le même cadre violet que les autres icônes de la
  // topbar, au lieu du bouton blanc plein écran de la démo d'origine.
  const rightAction = isAdmin ? (
    <button
      type="button"
      onClick={toggleBackofficeNav}
      aria-label={isBackofficeNavExpanded ? 'Fermer la navigation du backoffice' : 'Ouvrir la navigation du backoffice'}
      title="Navigation du backoffice"
      className="flex items-center justify-center p-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/15 transition-colors"
    >
      <div className="relative w-8 h-6 flex flex-col justify-between items-center scale-50">
        <span
          className={`block h-1 w-7 bg-current transition-transform duration-300 ${isBackofficeNavExpanded ? 'rotate-45 translate-y-2' : ''}`}
        />
        <span
          className={`block h-1 w-7 bg-current transition-opacity duration-300 ${isBackofficeNavExpanded ? 'opacity-0' : ''}`}
        />
        <span
          className={`block h-1 w-7 bg-current transition-transform duration-300 ${isBackofficeNavExpanded ? '-rotate-45 -translate-y-3' : ''}`}
        />
      </div>
    </button>
  ) : undefined;

  return (
    <>
      <NotchNav
        items={NAV_ITEMS}
        activeId={activeId}
        onActiveChange={handleActiveChange}
        logo={logo}
        rightContent={rightContent}
        rightAction={rightAction}
      >
        {children}
      </NotchNav>

      {/* Panneau de navigation backoffice — monté ici une seule fois,
          donc disponible sur TOUTES les pages (pas seulement /admin/*),
          et rendu directement dans document.body via un portail (voir
          BackofficeSidebar.tsx), donc sa position dans cet arbre n'a
          aucun impact sur son affichage. Réservé aux administrateurs :
          même condition que le bouton de déclenchement ci-dessus. */}
      {isAdmin && <BackofficeSidebar isMobileOpen={isBackofficeNavExpanded} onCloseMobile={closeBackofficeNav} />}
    </>
  );
};
