import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

  // BUG corrigé ici : la topbar entière (notch-nav.tsx) est UN SEUL
  // wrapper `fixed z-50` -- un seul contexte d'empilement CSS. Peu
  // importe le z-index donné à un élément À L'INTÉRIEUR de ce wrapper,
  // il ne peut JAMAIS dépasser visuellement un autre contexte
  // d'empilement extérieur comme la sidebar (portalée dans document.body
  // en z-[100], voir BackofficeSidebar.tsx) : un enfant plafonne toujours
  // au niveau de son parent. Résultat : une fois la sidebar ouverte, ce
  // bouton restait invisible/inaccessible sous elle, impossible à
  // refermer.
  //
  // Fix : le VRAI bouton reste bien à sa place normale dans la topbar
  // (via `rightAction`, groupé et aligné avec rightContent exactement
  // comme avant -- donc plus jamais de décalage entre les deux, quel
  // que soit l'écran ou le contenu de rightContent). Seul un CLONE de
  // ce bouton est portalé vers document.body, en `position: fixed` sur
  // des coordonnées MESURÉES en direct sur le vrai bouton
  // (getBoundingClientRect, jamais une valeur devinée en dur) -- donc
  // toujours pixel-parfait avec sa position réelle, quels que soient
  // la taille d'écran, le contenu de rightContent ou de futurs
  // ajustements de layout. Ce clone n'existe QUE pendant que la sidebar
  // est ouverte (z-[110], au-dessus de son z-[100]) ; le reste de la
  // topbar (logo, menu central, pilule rightContent), lui, reste bien
  // recouvert par la sidebar comme prévu.
  const sidebarToggleRef = useRef<HTMLButtonElement>(null);
  const [toggleClonePos, setToggleClonePos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!isAdmin || !isBackofficeNavExpanded) {
      setToggleClonePos(null);
      return;
    }
    const measure = () => {
      const rect = sidebarToggleRef.current?.getBoundingClientRect();
      if (rect) setToggleClonePos({ top: rect.top, left: rect.left });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isAdmin, isBackofficeNavExpanded]);

  const sidebarToggleIcon = (
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
  );

  const sidebarToggleLabel = isBackofficeNavExpanded ? 'Fermer la navigation du backoffice' : 'Ouvrir la navigation du backoffice';

  // Classes partagées entre le vrai bouton et son clone portalé : même
  // taille (h-10 w-10, identique au cercle de l'aside qui l'entoure
  // dans la topbar) pour que la mesure getBoundingClientRect() du vrai
  // bouton corresponde pile au cercle visible, sans saut de taille au
  // moment où le clone prend le relais.
  const sidebarToggleButtonClassName =
    'flex h-10 w-10 items-center justify-center rounded-full bg-[#3B3DD9] text-white/90 hover:text-white hover:bg-[#4749e0] transition-colors duration-200';

  const rightAction = isAdmin ? (
    <button
      ref={sidebarToggleRef}
      type="button"
      onClick={toggleBackofficeNav}
      aria-label={sidebarToggleLabel}
      title="Navigation du backoffice"
      className={sidebarToggleButtonClassName}
    >
      {sidebarToggleIcon}
    </button>
  ) : undefined;

  const sidebarToggleClone =
    isAdmin && toggleClonePos
      ? createPortal(
          <button
            type="button"
            onClick={toggleBackofficeNav}
            aria-label={sidebarToggleLabel}
            title="Navigation du backoffice"
            style={{ top: toggleClonePos.top, left: toggleClonePos.left }}
            className={`fixed z-[110] ${sidebarToggleButtonClassName}`}
          >
            {sidebarToggleIcon}
          </button>,
          document.body,
        )
      : null;

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

      {sidebarToggleClone}

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
