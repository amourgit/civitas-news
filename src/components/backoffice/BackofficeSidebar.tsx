// ============================================================
// src/components/backoffice/BackofficeSidebar.tsx
// Menu "kinetic" (GSAP + CustomEase, panneaux en éventail, formes
// ambiantes au survol, révélation animée des liens), fidèle au
// composant de référence : ouverture à DROITE. Contenu de navigation
// réel : registre de modèles, permissions, routes /admin/:modelKey,
// utilisateur connecté.
//
// Montage : global, une seule fois dans Header.tsx (topbar, visible
// sur TOUTES les pages) — plus seulement dans BackofficeLayout.tsx,
// qui ne couvrait que les routes /admin. Le déclencheur reste le
// bouton de la topbar, réservé aux administrateurs (voir Header.tsx :
// `isAdmin &&`), inchangé.
//
// Volontairement simple : TROIS effets seulement.
//   1. Mise en place unique (easing + survol des formes, par
//      délégation d'événements -> aucun re-câblage nécessaire quand
//      la recherche filtre la liste).
//   2. Ouverture/fermeture (+ verrou de scroll + touche Échap),
//      piloté uniquement par isMobileOpen.
//   3. Fermeture automatique à chaque changement de route (utile
//      maintenant que le panneau est global : couvre aussi bien un
//      clic sur un lien interne qu'une navigation déclenchée
//      ailleurs, ex. bouton retour du navigateur).
// Rendu directement dans document.body via un portail : le panneau
// est en position fixed, donc ne doit dépendre d'AUCUN ancêtre
// (un `transform`/`overflow` posé un jour plus haut dans l'arbre ne
// pourra plus jamais le casser).
// ============================================================

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { LayoutDashboard, Search, ChevronDown, ShieldCheck, User as UserIcon } from 'lucide-react';
import { groupModelsByApp } from './registry';
import { usePermissions } from '../../lib/permissions/usePermissions';
import { PERMISSIONS } from '../../lib/permissions/permissions.catalog';
import { useAuthStore } from '../../store/auth.store';
import './BackofficeSidebar.css';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(CustomEase);
}

export interface BackofficeSidebarProps {
  /** Panneau ouvert ? (unique état, partagé desktop + mobile.) */
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

function useMenuGroups(search: string) {
  const { can } = usePermissions();
  return useMemo(() => {
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
}

export const BackofficeSidebar: React.FC<BackofficeSidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const groups = useMenuGroups(search);
  const location = useLocation();
  const isFirstRender = useRef(true);

  // Panneau global (voir Header.tsx) : se referme sur tout changement de
  // route, qu'il vienne d'un lien interne (déjà couvert par
  // handleNavigate) ou d'une navigation externe au panneau (ex. retour
  // navigateur, redirection). Le premier passage de l'effet (montage)
  // est ignoré : un useEffect s'exécute toujours une fois au montage
  // même si la dépendance n'a "pas changé", ce qui déclencherait un
  // onCloseMobile() superflu au tout premier rendu de l'app.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onCloseMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleGroup = (appLabel: string) =>
    setExpandedGroups((prev) => ({ ...prev, [appLabel]: prev[appLabel] === false ? true : false }));

  // 1) Mise en place unique — easing custom + survol des formes ambiantes
  // par délégation (un seul listener sur .menu-list : fonctionne quel que
  // soit le nombre de groupes, y compris quand la recherche en ajoute/retire).
  useLayoutEffect(() => {
    const list = containerRef.current?.querySelector('.menu-list');
    const shapesContainer = containerRef.current?.querySelector('.ambient-background-shapes');
    if (!list || !shapesContainer) return;

    try {
      if (!gsap.parseEase('main')) {
        CustomEase.create('main', '0.65, 0.01, 0.05, 0.99');
        gsap.defaults({ ease: 'main', duration: 0.7 });
      }
    } catch {
      gsap.defaults({ ease: 'power2.out', duration: 0.7 });
    }

    const shapeFor = (target: EventTarget | null) => {
      const item = (target as HTMLElement)?.closest?.('.menu-list-item[data-shape]');
      if (!item) return null;
      return shapesContainer.querySelector(`.bg-shape-${item.getAttribute('data-shape')}`);
    };

    const handleOver = (e: Event) => {
      const shape = shapeFor(e.target);
      if (!shape) return;
      shapesContainer.querySelectorAll('.bg-shape').forEach((s) => s.classList.remove('active'));
      shape.classList.add('active');
      gsap.fromTo(
        shape.querySelectorAll('.shape-element'),
        { scale: 0.5, opacity: 0, rotation: -10 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.6, stagger: 0.08, ease: 'back.out(1.7)', overwrite: 'auto' },
      );
    };

    const handleOut = (e: Event) => {
      const shape = shapeFor(e.target);
      if (!shape) return;
      gsap.to(shape.querySelectorAll('.shape-element'), {
        scale: 0.8,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => shape.classList.remove('active'),
        overwrite: 'auto',
      });
    };

    list.addEventListener('mouseover', handleOver);
    list.addEventListener('mouseout', handleOut);
    return () => {
      list.removeEventListener('mouseover', handleOver);
      list.removeEventListener('mouseout', handleOut);
    };
  }, []);

  // 2) Ouverture / fermeture + verrou de scroll + touche Échap — tout ce qui
  // dépend de isMobileOpen, au même endroit.
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const originalOverflow = document.body.style.overflow;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    const ctx = gsap.context(() => {
      const navWrap = containerRef.current!.querySelector('.nav-overlay-wrapper');
      const menu = containerRef.current!.querySelector('.menu-content');
      const overlay = containerRef.current!.querySelector('.overlay');
      const bgPanels = containerRef.current!.querySelectorAll('.backdrop-layer');
      const menuLinks = containerRef.current!.querySelectorAll('.nav-link');
      const fadeTargets = containerRef.current!.querySelectorAll('[data-menu-fade]');
      const menuButton = containerRef.current!.querySelector('.nav-close-btn');
      const menuButtonTexts = menuButton?.querySelectorAll('p');
      const menuButtonIcon = menuButton?.querySelector('.menu-button-icon');

      const tl = gsap.timeline();

      if (isMobileOpen) {
        // OUVERTURE
        if (navWrap) navWrap.setAttribute('data-nav', 'open');

        tl.set(navWrap, { display: 'block' })
          .set(menu, { xPercent: 0 }, '<')
          .fromTo(menuButtonTexts, { yPercent: 0 }, { yPercent: -100, stagger: 0.2 })
          .fromTo(menuButtonIcon, { rotate: 0 }, { rotate: 315 }, '<')
          .fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1 }, '<')
          .fromTo(bgPanels, { xPercent: 101 }, { xPercent: 0, stagger: 0.12, duration: 0.575 }, '<')
          .fromTo(menuLinks, { yPercent: 140, rotate: 10 }, { yPercent: 0, rotate: 0, stagger: 0.05 }, '<+=0.35');

        if (fadeTargets.length) {
          tl.fromTo(fadeTargets, { autoAlpha: 0, yPercent: 50 }, { autoAlpha: 1, yPercent: 0, stagger: 0.04, clearProps: 'all' }, '<+=0.2');
        }
      } else {
        // FERMETURE
        if (navWrap) navWrap.setAttribute('data-nav', 'closed');

        tl.to(overlay, { autoAlpha: 0 })
          .to(menu, { xPercent: 120 }, '<')
          .to(menuButtonTexts, { yPercent: 0 }, '<')
          .to(menuButtonIcon, { rotate: 0 }, '<')
          .set(navWrap, { display: 'none' });
      }
    }, containerRef);

    return () => {
      ctx.revert();
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileOpen, onCloseMobile]);

  const handleNavigate = () => onCloseMobile();

  return createPortal(
    <div ref={containerRef}>
      <div className="nav-overlay-wrapper" data-nav={isMobileOpen ? 'open' : 'closed'}>
        <div className="overlay" onClick={onCloseMobile} aria-hidden="true" />

        <nav className="menu-content" role="dialog" aria-modal="true" aria-label="Navigation du backoffice">
          <div className="menu-bg">
            <div className="backdrop-layer first" />
            <div className="backdrop-layer second" />
            <div className="backdrop-layer" />

            <div className="ambient-background-shapes">
              <svg className="bg-shape bg-shape-1" viewBox="0 0 400 400" fill="none">
                <circle className="shape-element" cx="80" cy="120" r="40" fill="rgba(99,102,241,0.15)" />
                <circle className="shape-element" cx="300" cy="80" r="60" fill="rgba(139,92,246,0.12)" />
                <circle className="shape-element" cx="200" cy="300" r="80" fill="rgba(236,72,153,0.1)" />
                <circle className="shape-element" cx="350" cy="280" r="30" fill="rgba(99,102,241,0.15)" />
              </svg>

              <svg className="bg-shape bg-shape-2" viewBox="0 0 400 400" fill="none">
                <path className="shape-element" d="M0 200 Q100 100, 200 200 T 400 200" stroke="rgba(99,102,241,0.2)" strokeWidth="60" fill="none" />
                <path className="shape-element" d="M0 280 Q100 180, 200 280 T 400 280" stroke="rgba(139,92,246,0.15)" strokeWidth="40" fill="none" />
              </svg>

              <svg className="bg-shape bg-shape-3" viewBox="0 0 400 400" fill="none">
                <circle className="shape-element" cx="50" cy="50" r="8" fill="rgba(99,102,241,0.3)" />
                <circle className="shape-element" cx="150" cy="50" r="8" fill="rgba(139,92,246,0.3)" />
                <circle className="shape-element" cx="250" cy="50" r="8" fill="rgba(236,72,153,0.3)" />
                <circle className="shape-element" cx="350" cy="50" r="8" fill="rgba(99,102,241,0.3)" />
                <circle className="shape-element" cx="100" cy="150" r="12" fill="rgba(139,92,246,0.25)" />
                <circle className="shape-element" cx="200" cy="150" r="12" fill="rgba(236,72,153,0.25)" />
                <circle className="shape-element" cx="300" cy="150" r="12" fill="rgba(99,102,241,0.25)" />
                <circle className="shape-element" cx="50" cy="250" r="10" fill="rgba(236,72,153,0.3)" />
                <circle className="shape-element" cx="150" cy="250" r="10" fill="rgba(99,102,241,0.3)" />
                <circle className="shape-element" cx="250" cy="250" r="10" fill="rgba(139,92,246,0.3)" />
                <circle className="shape-element" cx="350" cy="250" r="10" fill="rgba(236,72,153,0.3)" />
                <circle className="shape-element" cx="100" cy="350" r="6" fill="rgba(99,102,241,0.3)" />
                <circle className="shape-element" cx="200" cy="350" r="6" fill="rgba(139,92,246,0.3)" />
                <circle className="shape-element" cx="300" cy="350" r="6" fill="rgba(236,72,153,0.3)" />
              </svg>

              <svg className="bg-shape bg-shape-4" viewBox="0 0 400 400" fill="none">
                <path className="shape-element" d="M100 100 Q150 50, 200 100 Q250 150, 200 200 Q150 250, 100 200 Q50 150, 100 100" fill="rgba(99,102,241,0.12)" />
                <path className="shape-element" d="M250 200 Q300 150, 350 200 Q400 250, 350 300 Q400 250, 350 300 Q300 350, 250 300 Q200 250, 250 200" fill="rgba(236,72,153,0.1)" />
              </svg>

              <svg className="bg-shape bg-shape-5" viewBox="0 0 400 400" fill="none">
                <line className="shape-element" x1="0" y1="100" x2="300" y2="400" stroke="rgba(99,102,241,0.15)" strokeWidth="30" />
                <line className="shape-element" x1="100" y1="0" x2="400" y2="300" stroke="rgba(139,92,246,0.12)" strokeWidth="25" />
                <line className="shape-element" x1="200" y1="0" x2="400" y2="200" stroke="rgba(236,72,153,0.1)" strokeWidth="20" />
              </svg>
            </div>
          </div>

          <div className="menu-content-wrapper">
            <div className="menu-header-row">
              <div className="menu-brand-badge">
                <div className="menu-brand-icon">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="menu-brand-label">CIVITAS Backoffice</span>
              </div>

              <button type="button" className="nav-close-btn" onClick={onCloseMobile} aria-label="Fermer la navigation">
                <div className="menu-button-text">
                  <p>Menu</p>
                  <p>Close</p>
                </div>
                <div className="icon-wrap">
                  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 16 16" fill="none" className="menu-button-icon">
                    <path d="M7.33333 16L7.33333 -3.2055e-07L8.66667 -3.78832e-07L8.66667 16L7.33333 16Z" fill="currentColor" />
                    <path d="M16 8.66667L-2.62269e-07 8.66667L-3.78832e-07 7.33333L16 7.33333L16 8.66667Z" fill="currentColor" />
                    <path d="M6 7.33333L7.33333 7.33333L7.33333 6C7.33333 6.73637 6.73638 7.33333 6 7.33333Z" fill="currentColor" />
                    <path d="M10 7.33333L8.66667 7.33333L8.66667 6C8.66667 6.73638 9.26362 7.33333 10 7.33333Z" fill="currentColor" />
                    <path d="M6 8.66667L7.33333 8.66667L7.33333 10C7.33333 9.26362 6.73638 8.66667 6 8.66667Z" fill="currentColor" />
                    <path d="M10 8.66667L8.66667 8.66667L8.66667 10C8.66667 9.26362 9.26362 8.66667 10 8.66667Z" fill="currentColor" />
                  </svg>
                </div>
              </button>
            </div>

            <div className="menu-search-wrap" data-menu-fade>
              <Search className="w-4 h-4 menu-search-icon" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une table..."
                className="menu-search-input"
              />
            </div>

            <ul className="menu-list">
              <li className="menu-list-item" data-shape="1">
                <NavLink to="/admin" end onClick={handleNavigate} className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}>
                  <LayoutDashboard className="nav-link-icon" />
                  <p className="nav-link-text">Tableau de bord</p>
                  <div className="nav-link-hover-bg" />
                </NavLink>
              </li>

              {groups.map((group, idx) => {
                const isOpen = search.trim() ? true : expandedGroups[group.appLabel] !== false;
                const shapeIndex = ((idx + 1) % 5) + 1;
                return (
                  <li className="menu-list-item" data-shape={shapeIndex} key={group.appLabel}>
                    <button type="button" onClick={() => toggleGroup(group.appLabel)} className="nav-link" aria-expanded={isOpen}>
                      <p className="nav-link-text">{group.appLabel}</p>
                      <ChevronDown className={`nav-link-chevron${isOpen ? '' : ' is-collapsed'}`} />
                      <div className="nav-link-hover-bg" />
                    </button>

                    {isOpen && (
                      <ul className="submenu-list">
                        {group.models.map((model) => {
                          const Icon = model.icon;
                          return (
                            <li key={model.key}>
                              <NavLink
                                to={`/admin/${model.key}`}
                                onClick={handleNavigate}
                                className={({ isActive }) => `submenu-link${isActive ? ' is-active' : ''}`}
                              >
                                <Icon className="submenu-link-icon" />
                                <span>{model.labelPlural}</span>
                              </NavLink>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}

              {groups.length === 0 && search.trim() && (
                <p className="menu-empty-hint">Aucune table ne correspond à « {search} ».</p>
              )}
            </ul>

            {user && (
              <NavLink to="/profil" onClick={handleNavigate} className="menu-footer-link">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.nomAffiche} className="menu-footer-avatar" />
                ) : (
                  <div className="menu-footer-avatar-fallback">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="menu-footer-name">{user.nomAffiche}</span>
              </NavLink>
            )}
          </div>
        </nav>
      </div>
    </div>,
    document.body,
  );
};
