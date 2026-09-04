// ============================================================
// src/components/layout/ProfileDropdown.tsx
// Menu déroulant du profil, ouvert depuis l'avatar de la topbar
// (voir Header.tsx) — remplace l'ancien comportement où l'avatar était
// un lien direct vers /profil sans intermédiaire.
//
// Adapté à partir d'une référence externe (shadcn/ui DropdownMenu +
// Iconify) mais reconstruit avec les briques déjà utilisées dans ce
// projet : pas de Radix ni d'Iconify ici — Avatar/Badge maison
// (components/ui/), icônes lucide-react, animations via `motion/react`
// (déjà la lib d'animation du projet, voir Modal.tsx/Toast.tsx).
//
// Positionnement — portail vers document.body (créPortal) :
// NotchNav (voir ui/notch-nav.tsx) rend l'avatar déclencheur soit dans
// son notch desktop `<aside>` (à partir de xl:), soit dans un îlot
// compact CENTRÉ horizontalement (tablette/mobile, `left-1/2
// -translate-x-1/2`) — dans ce second cas le bouton n'est PAS près du
// bord droit réel de l'écran, donc un calcul de position qui suppose
// une largeur de panneau estimée peut se tromper et pousser le menu
// hors de l'écran. Le panneau est donc : (1) sorti du DOM de NotchNav
// via un portail, pour ne dépendre d'AUCUN ancêtre (mise en page,
// défilement tactile, futures animations) ; (2) positionné en deux
// passes — une estimation immédiate au clic (évite un flash à 0,0),
// puis une correction via useLayoutEffect une fois le panneau
// réellement monté, en mesurant sa largeur RENDUE (getBoundingClientRect)
// plutôt qu'une estimation par palier d'écran, avant même la première
// peinture du navigateur.
//
// Étiquette "dev" : certaines options de la maquette d'origine n'ont
// aucun équivalent réel dans CIVITAS NEWS aujourd'hui (statut de
// présence, compte vérifié/parrainage, centre d'aide, multi-comptes,
// app installable...). Plutôt que de les proposer comme si elles
// fonctionnaient, elles restent visibles (structure "copier/coller"
// conservée) mais estompées + étiquetées (dev) ; un clic dessus
// affiche un toast "bientôt disponible" au lieu de ne rien faire ou de
// casser silencieusement. Seules les options réellement câblées
// (Votre profil, Apparence, Notifications, Paramètres, Se déconnecter)
// gardent la pleine opacité et une vraie action.
// ============================================================

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Sun,
  Moon,
  Bell,
  Settings,
  Smile,
  BadgeCheck,
  Gift,
  Download,
  Sparkles,
  HelpCircle,
  Users,
  LogOut,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { ConfirmDialog } from '../backoffice/ConfirmDialog';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/ui.store';
import { toast } from '../../hooks/useToast';

const ROLE_LABELS: Record<string, string> = {
  etudiant: 'Étudiant',
  organisation: 'Organisation',
  moderateur: 'Modérateur',
  administrateur: 'Administrateur',
};

// Largeur du panneau par palier d'écran — petite sur mobile, moyenne
// sur tablette, identique à l'existant sur desktop. N'a plus besoin
// d'être précise : elle ne sert que d'estimation pour le tout premier
// rendu (avant que le panneau existe dans le DOM et soit mesurable) ;
// la position réelle est ensuite corrigée à partir de la largeur
// RENDUE (voir computeCoords/useLayoutEffect). La classe Tailwind
// ci-dessous reste la seule source de vérité pour la largeur affichée.
function estimatePanelWidth(viewportWidth: number): number {
  if (viewportWidth < 640) return Math.min(viewportWidth * 0.78, 240);
  if (viewportWidth < 1280) return 288;
  return 300;
}

const PANEL_WIDTH_CLASSES = 'w-[min(78vw,240px)] sm:w-72 xl:w-[300px] max-w-[calc(100vw-0.75rem)]';
const VIEWPORT_MARGIN = 8;

interface MenuRowProps {
  icon: React.ReactNode;
  label: string;
  trailing?: React.ReactNode;
  dev?: boolean;
  danger?: boolean;
  onSelect: () => void;
}

const MenuRow: React.FC<MenuRowProps> = ({ icon, label, trailing, dev, danger, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className={`w-full flex items-center justify-between gap-1.5 px-2 py-1.5 sm:gap-2 sm:px-3 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-left transition-colors ${
      dev
        ? 'text-gray-400 dark:text-gray-500 opacity-60 hover:opacity-90 hover:bg-gray-50 dark:hover:bg-gray-800/50'
        : danger
        ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
  >
    <span className="flex items-center gap-2 min-w-0">
      <span className="shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5 sm:[&>svg]:w-[18px] sm:[&>svg]:h-[18px]">{icon}</span>
      <span className="truncate">{label}</span>
      {dev && (
        <span className="shrink-0 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 sm:px-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500">
          dev
        </span>
      )}
    </span>
    {trailing && <span className="shrink-0 text-[11px] sm:text-xs font-normal text-gray-400 dark:text-gray-500">{trailing}</span>}
  </button>
);

interface Coords {
  top: number;
  left: number;
  maxHeight: number;
}

export const ProfileDropdown: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuthStore();
  const { theme, toggleTheme } = useUiStore();

  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<Coords>({ top: 0, left: 0, maxHeight: 420 });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // measuredWidth absent -> estimation par palier (avant montage du
  // panneau) ; fourni -> largeur réellement rendue (après montage),
  // qui corrige toute imprécision de l'estimation. Le panneau est
  // toujours aligné sur le bord DROIT du déclencheur (comme un avatar
  // en haut à droite), mais jamais poussé hors de l'écran, ni à
  // gauche ni à droite.
  const computeCoords = useCallback((measuredWidth?: number) => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = measuredWidth ?? estimatePanelWidth(window.innerWidth);
    const top = rect.bottom + VIEWPORT_MARGIN;
    const left = Math.min(
      Math.max(VIEWPORT_MARGIN, rect.right - width),
      window.innerWidth - width - VIEWPORT_MARGIN,
    );
    // Plafond de hauteur = place réellement disponible sous le
    // déclencheur, jamais plus des 3/4 de l'écran : le menu (une
    // douzaine de lignes) déborde largement des petits écrans
    // (mobile/tablette en hauteur réduite, mode paysage...) — sans ce
    // plafond + le défilement interne posé sur le contenu (voir plus
    // bas), il se retrouvait coupé sous le bas de l'écran au lieu de
    // s'afficher proprement sous le bouton.
    const maxHeight = Math.min(
      Math.max(200, window.innerHeight - top - VIEWPORT_MARGIN),
      window.innerHeight * 0.75,
    );
    setCoords({ top, left, maxHeight });
  }, []);

  const handleTriggerClick = () => {
    if (!isOpen) computeCoords();
    setIsOpen((v) => !v);
  };

  // Deuxième passe, une fois le panneau réellement monté : on corrige
  // la position avec sa largeur RENDUE (dépend des classes Tailwind
  // responsives ci-dessus) plutôt que l'estimation — s'exécute avant
  // la peinture du navigateur, donc aucun flash visible.
  useLayoutEffect(() => {
    if (isOpen && panelRef.current) {
      computeCoords(panelRef.current.getBoundingClientRect().width);
    }
  }, [isOpen, computeCoords]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current?.contains(e.target as Node) ||
        triggerRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setIsOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleReposition = () => computeCoords(panelRef.current?.getBoundingClientRect().width);

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleReposition);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleReposition);
    };
  }, [isOpen, computeCoords]);

  const goTo = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const notYetAvailable = () => {
    setIsOpen(false);
    toast('info', 'Bientôt disponible', 'Cette fonctionnalité est encore en développement.');
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      toast('success', 'Déconnexion effectuée.', 'À bientôt sur CIVITAS !');
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
      setIsOpen(false);
      navigate('/');
    }
  };

  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={user.nomAffiche}
        className="flex items-center justify-center w-6 h-6 rounded-full overflow-hidden border border-white/30 hover:border-white/70 transition-colors shrink-0"
      >
        {user.avatar ? (
          <img src={user.avatar} alt={user.nomAffiche} className="w-full h-full object-cover" />
        ) : (
          <span className="w-full h-full flex items-center justify-center bg-white/15 text-white text-[10px] font-bold uppercase">
            {user.nomAffiche.charAt(0)}
          </span>
        )}
      </button>

      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={panelRef}
              role="menu"
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: 'fixed', top: coords.top, left: coords.left, transformOrigin: 'top right' }}
              className={`z-[60] ${PANEL_WIDTH_CLASSES} rounded-2xl bg-gray-50 dark:bg-black/90 p-0 shadow-[0_16px_48px_rgba(26,31,77,0.2)] overflow-hidden`}
            >
              {/* Défilement interne plafonné à la place réellement
                  disponible sous le bouton (voir computeCoords) : sur
                  un petit écran (mobile, tablette en paysage...), la
                  douzaine de lignes du menu ne rentre pas toujours sous
                  la topbar — plutôt que de déborder hors de l'écran, le
                  panneau reste entièrement visible et devient
                  défilable. -webkit-overflow-scrolling assure un
                  défilement tactile fluide sur Safari iOS. */}
              <div
                className="overflow-y-auto overscroll-contain"
                style={{ maxHeight: coords.maxHeight, WebkitOverflowScrolling: 'touch' }}
              >
                <section className="bg-white dark:bg-gray-100/10 backdrop-blur-lg rounded-2xl p-1 sm:p-1.5 shadow border border-gray-200 dark:border-gray-700/20">
                  {/* En-tête : identité réelle de l'utilisateur connecté */}
                  <div className="flex items-center gap-2 p-1.5 sm:gap-2.5 sm:p-2">
                    <Avatar src={user.avatar ?? undefined} name={user.nomAffiche} size="sm" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate">{user.nomAffiche}</h3>
                      <p className="text-muted-foreground text-[11px] sm:text-xs truncate">@{user.username}</p>
                    </div>
                    <Badge variant={isAdmin ? 'purple' : 'outline'} size="sm" className="shrink-0">
                      {roleLabel}
                    </Badge>
                  </div>

                  <div className="h-px bg-gray-100 dark:bg-gray-800 my-0.5 sm:my-1" />

                  {/* Aucun système de présence (en ligne/hors ligne) dans
                      CIVITAS NEWS aujourd'hui — conservé comme option
                      visible mais étiquetée (dev). */}
                  <MenuRow icon={<Smile />} label="Changer de statut" dev onSelect={notYetAvailable} />

                  <div className="h-px bg-gray-100 dark:bg-gray-800 my-0.5 sm:my-1" />

                  <MenuRow icon={<User />} label="Votre profil" onSelect={() => goTo('/profil')} />
                  <MenuRow
                    icon={theme === 'dark' ? <Moon /> : <Sun />}
                    label="Apparence"
                    trailing={theme === 'dark' ? 'Sombre' : 'Clair'}
                    onSelect={() => {
                      toggleTheme();
                      setIsOpen(false);
                    }}
                  />
                  <MenuRow icon={<Bell />} label="Notifications" onSelect={() => goTo('/notifications')} />
                  <MenuRow icon={<Settings />} label="Paramètres" onSelect={() => goTo('/parametres')} />

                  <div className="h-px bg-gray-100 dark:bg-gray-800 my-0.5 sm:my-1" />

                  {/* Pas de compte vérifié ni de parrainage côté CIVITAS
                      NEWS pour l'instant. */}
                  <MenuRow icon={<BadgeCheck />} label="Compte vérifié" dev onSelect={notYetAvailable} />
                  <MenuRow icon={<Gift />} label="Parrainage" dev onSelect={notYetAvailable} />

                  <div className="h-px bg-gray-100 dark:bg-gray-800 my-0.5 sm:my-1" />

                  {/* Pas d'app installable, de journal des nouveautés ni de
                      centre d'aide dédié pour l'instant (le bouton "Aide"
                      de la topbar n'a lui non plus aucune action câblée). */}
                  <MenuRow icon={<Download />} label="Télécharger l'application" dev onSelect={notYetAvailable} />
                  <MenuRow icon={<Sparkles />} label="Quoi de neuf ?" dev onSelect={notYetAvailable} />
                  <MenuRow icon={<HelpCircle />} label="Aide & Support" dev onSelect={notYetAvailable} />
                </section>

                <section className="mt-0.5 sm:mt-1 p-1 sm:p-1.5 rounded-2xl">
                  {/* Pas de multi-comptes dans CIVITAS NEWS aujourd'hui. */}
                  <MenuRow icon={<Users />} label="Changer de compte" dev onSelect={notYetAvailable} />
                  <MenuRow
                    icon={<LogOut />}
                    label="Se déconnecter"
                    danger
                    onSelect={() => {
                      setIsOpen(false);
                      setShowLogoutConfirm(true);
                    }}
                  />
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Se déconnecter"
        description="Vous serez déconnecté de votre session sur cet appareil. Vous pourrez vous reconnecter à tout moment."
        confirmLabel="Se déconnecter"
        isLoading={isLoggingOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
};

export default ProfileDropdown;
