// ============================================================
// src/components/backoffice/BackofficeSidebar.tsx
// Panneau "curved navbar" (référence fournie telle quelle : liste
// numérotée avec animation de lettres au survol + volet plein écran
// qui glisse depuis la droite avec un bord SVG incurvé). Design et
// animation IDENTIQUES à la référence — seule l'intégration change :
//   - next/link -> react-router-dom (Link), "framer-motion" ->
//     "motion/react" (paquet réellement installé, voir notch-nav.tsx
//     pour le même précédent).
//   - Le bouton de déclenchement (hamburger + son animation) ne vit
//     plus ici : il est désormais câblé dans la topbar elle-même (voir
//     Header.tsx), au même endroit qu'avant. Ce fichier ne gère donc
//     que le volet, piloté par isMobileOpen/onCloseMobile — même
//     contrat qu'avant.
//   - navItems n'est plus une liste statique de démo (Home/Components/
//     Services/Contact) : chaque table du registre backoffice devient
//     une entrée, filtrée par permission (voir usePermissions +
//     PERMISSIONS.catalog), exactement comme le faisait l'ancien menu
//     kinetic — c'est la même logique de permissions, seulement
//     reprise dans la structure plate de la référence (pas de
//     sous-groupes rétractables : la référence n'en a pas, et on ne
//     touche pas à son design).
//   - Rendu dans document.body via un portail (le panneau est fixed,
//     donc ne doit dépendre d'aucun ancêtre — même précaution que
//     l'ancienne implémentation).
// ============================================================

import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, AnimatePresence } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';
import { User as UserIcon } from 'lucide-react';
import { groupModelsByApp } from './registry';
import { usePermissions } from '../../lib/permissions/usePermissions';
import { PERMISSIONS } from '../../lib/permissions/permissions.catalog';
import { useAuthStore } from '../../store/auth.store';

interface SidebarNavItem {
  heading: string;
  href: string;
}

const MENU_SLIDE_ANIMATION = {
  initial: { x: 'calc(100% + 100px)' },
  enter: { x: '0', transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } },
  exit: {
    x: 'calc(100% + 100px)',
    transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
  },
} as const;

interface SidebarNavLinkProps extends SidebarNavItem {
  index: number;
  onNavigate: () => void;
}

const SidebarNavLink: React.FC<SidebarNavLinkProps> = ({ heading, href, index, onNavigate }) => {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    const rect = ref.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);
  };

  return (
    <motion.div
      onClick={onNavigate}
      initial="initial"
      whileHover="whileHover"
      className="group relative flex items-center justify-between border-b border-black/30 py-4 transition-colors duration-500 md:py-8 uppercase"
    >
      <Link ref={ref} onMouseMove={handleMouseMove} to={href}>
        <div className="relative flex items-start">
          <span className="text-black transition-colors duration-500 text-4xl font-thin mr-2">{index}.</span>
          <div className="flex flex-row gap-2">
            <motion.span
              variants={{
                initial: { x: 0 },
                whileHover: { x: -16 },
              }}
              transition={{
                type: 'spring',
                staggerChildren: 0.075,
                delayChildren: 0.25,
              }}
              className="relative z-10 block text-4xl font-extralight text-black transition-colors duration-500 md:text-4xl"
            >
              {heading.split('').map((letter, i) => (
                <motion.span
                  key={i}
                  variants={{
                    initial: { x: 0 },
                    whileHover: { x: 16 },
                  }}
                  transition={{ type: 'spring' }}
                  className="inline-block"
                >
                  {letter === ' ' ? '\u00A0' : letter}
                </motion.span>
              ))}
            </motion.span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const Curve: React.FC = () => {
  const initialPath = `M100 0 L200 0 L200 ${window.innerHeight} L100 ${window.innerHeight} Q-100 ${window.innerHeight / 2} 100 0`;
  const targetPath = `M100 0 L200 0 L200 ${window.innerHeight} L100 ${window.innerHeight} Q100 ${window.innerHeight / 2} 100 0`;

  const curve = {
    initial: { d: initialPath },
    enter: {
      d: targetPath,
      transition: { duration: 1, ease: [0.76, 0, 0.24, 1] },
    },
    exit: {
      d: initialPath,
      transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
    },
  } as const;

  return (
    <svg className="absolute top-0 -left-[99px] w-[100px] stroke-none h-full" style={{ fill: '#ffffff' }}>
      <motion.path variants={curve} initial="initial" animate="enter" exit="exit" />
    </svg>
  );
};

interface CurvedNavbarProps {
  navItems: SidebarNavItem[];
  onRequestClose: () => void;
  footer?: React.ReactNode;
}

const CurvedNavbar: React.FC<CurvedNavbarProps> = ({ navItems, onRequestClose, footer }) => {
  return (
    <motion.div
      variants={MENU_SLIDE_ANIMATION}
      initial="initial"
      animate="enter"
      exit="exit"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation du backoffice"
      className="h-[100dvh] w-screen max-w-screen-sm fixed right-0 top-0 z-[100] bg-white"
    >
      <div className="h-full pt-11 flex flex-col justify-between">
        <div className="flex flex-col text-5xl gap-3 mt-0 px-10 md:px-24">
          <div className="text-black border-b border-black/30 uppercase text-sm mb-0">
            <p>Navigation</p>
          </div>
          <section className="bg-transparent mt-0">
            <div className="mx-auto max-w-7xl">
              {navItems.map((item, index) => (
                <SidebarNavLink key={item.href} heading={item.heading} href={item.href} index={index + 1} onNavigate={onRequestClose} />
              ))}
            </div>
          </section>
        </div>
        {footer}
      </div>
      <Curve />
    </motion.div>
  );
};

/** Reprend la même logique de filtrage par permission que l'ancien menu
 * kinetic (voir groupModelsByApp + can()), simplement aplatie : chaque
 * table accessible devient une entrée numérotée, "Tableau de bord" en
 * tête de liste. */
function useBackofficeNavItems(): SidebarNavItem[] {
  const { can } = usePermissions();
  return useMemo(() => {
    const items: SidebarNavItem[] = [{ heading: 'Tableau de bord', href: '/admin' }];
    groupModelsByApp().forEach((group) => {
      group.models.forEach((model) => {
        if (!can(model.viewPermission ?? PERMISSIONS.BACKOFFICE_ACCESS)) return;
        items.push({ heading: model.labelPlural, href: `/admin/${model.key}` });
      });
    });
    return items;
  }, [can]);
}

export interface BackofficeSidebarProps {
  /** Panneau ouvert ? (état unique, piloté depuis la topbar — voir Header.tsx). */
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const BackofficeSidebar: React.FC<BackofficeSidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const navItems = useBackofficeNavItems();
  const isFirstRender = useRef(true);

  // Panneau global (monté une seule fois dans Header.tsx) : se referme
  // sur tout changement de route, qu'il vienne d'un lien interne (déjà
  // couvert par onRequestClose ci-dessus) ou d'une navigation externe
  // (retour navigateur, redirection). Le tout premier passage est
  // ignoré pour ne pas fermer un panneau qui vient d'être ouvert.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onCloseMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Verrou de scroll + touche Échap pendant que le panneau est ouvert.
  useEffect(() => {
    if (!isMobileOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileOpen, onCloseMobile]);

  const footer = user ? (
    <Link
      to="/profil"
      onClick={onCloseMobile}
      className="flex items-center gap-3 text-sm text-black px-10 md:px-24 py-5 hover:opacity-70 transition-opacity"
    >
      {user.avatar ? (
        <img src={user.avatar} alt={user.nomAffiche} className="w-8 h-8 rounded-full object-cover" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
          <UserIcon className="w-4 h-4" />
        </div>
      )}
      <span className="font-medium uppercase tracking-tight">{user.nomAffiche}</span>
    </Link>
  ) : undefined;

  return createPortal(
    <AnimatePresence mode="wait">
      {isMobileOpen && <CurvedNavbar navItems={navItems} onRequestClose={onCloseMobile} footer={footer} />}
    </AnimatePresence>,
    document.body,
  );
};
