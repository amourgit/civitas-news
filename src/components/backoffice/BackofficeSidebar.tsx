// ============================================================
// src/components/backoffice/BackofficeSidebar.tsx
// Reprend intégralement l'animation "kinetic navigation" (GSAP +
// CustomEase, panneaux en éventail, fond animé de formes, révélation
// des liens) fournie comme référence — mais MIROIR : le panneau
// s'ouvre désormais à GAUCHE de l'écran (tous les xPercent/insets
// horizontaux sont inversés par rapport à l'original, qui s'ouvrait à
// droite). Le contenu de navigation n'est plus une démo statique :
// c'est le VRAI registre de modèles (voir registry/), les VRAIES
// permissions, les VRAIES routes /admin/:modelKey et le VRAI
// utilisateur connecté — aucune donnée fictive.
//
// Un seul mode de rendu, piloté entièrement par les props
// (isMobileOpen / onCloseMobile), utilisé aussi bien sur desktop que
// sur mobile : cliquer sur l'icône de navigation du backoffice (voir
// Header.tsx) ouvre ce même panneau plein-écran quel que soit le
// viewport.
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
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
  /** Panneau ouvert ? (unique état, partagé desktop + mobile — voir Header.tsx / BackofficeLayout.tsx). */
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

/** Contenu de navigation : dashboard + groupes d'apps du registre,
 * filtrés par permission et par la recherche en temps réel. Partagé
 * entre le rendu et le câblage GSAP (le hover des formes cible
 * `.menu-list-item[data-shape]`, quel que soit le nombre réel de
 * groupes). */
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

  // Montage paresseux : le panneau ne rentre dans le DOM qu'à la
  // première ouverture, puis y reste (display GSAP géré ensuite) --
  // évite tout flash et garde `role="dialog"` absent tant que jamais
  // ouvert.
  const [hasOpenedOnce, setHasOpenedOnce] = useState(isMobileOpen);
  useEffect(() => {
    if (isMobileOpen) setHasOpenedOnce(true);
  }, [isMobileOpen]);

  const toggleGroup = (appLabel: string) =>
    setExpandedGroups((prev) => ({ ...prev, [appLabel]: prev[appLabel] === false ? true : false }));

  // Verrouille le scroll du body pendant que le panneau est ouvert.
  useEffect(() => {
    if (!isMobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isMobileOpen]);

  // Échap referme le panneau.
  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  // Easing custom + hover des formes ambiantes — mis en place une fois
  // que le panneau est réellement monté dans le DOM (montage paresseux
  // ci-dessus, donc dépendance sur hasOpenedOnce et non `[]`).
  useEffect(() => {
    if (!hasOpenedOnce || !containerRef.current) return;

    try {
      if (!gsap.parseEase('main')) {
        CustomEase.create('main', '0.65, 0.01, 0.05, 0.99');
        gsap.defaults({ ease: 'main', duration: 0.7 });
      }
    } catch (e) {
      console.warn('CustomEase failed to load, falling back to default.', e);
      gsap.defaults({ ease: 'power2.out', duration: 0.7 });
    }

    const ctx = gsap.context(() => {
      const menuItems = containerRef.current!.querySelectorAll('.menu-list-item[data-shape]');
      const shapesContainer = containerRef.current!.querySelector('.ambient-background-shapes');

      menuItems.forEach((item) => {
        const shapeIndex = item.getAttribute('data-shape');
        const shape = shapesContainer ? shapesContainer.querySelector(`.bg-shape-${shapeIndex}`) : null;
        if (!shape) return;

        const shapeEls = shape.querySelectorAll('.shape-element');

        const onEnter = () => {
          if (shapesContainer) {
            shapesContainer.querySelectorAll('.bg-shape').forEach((s) => s.classList.remove('active'));
          }
          shape.classList.add('active');
          gsap.fromTo(
            shapeEls,
            { scale: 0.5, opacity: 0, rotation: -10 },
            { scale: 1, opacity: 1, rotation: 0, duration: 0.6, stagger: 0.08, ease: 'back.out(1.7)', overwrite: 'auto' },
          );
        };

        const onLeave = () => {
          gsap.to(shapeEls, {
            scale: 0.8,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => shape.classList.remove('active'),
            overwrite: 'auto',
          });
        };

        item.addEventListener('mouseenter', onEnter);
        item.addEventListener('mouseleave', onLeave);
        (item as any)._cleanup = () => {
          item.removeEventListener('mouseenter', onEnter);
          item.removeEventListener('mouseleave', onLeave);
        };
      });
    }, containerRef);

    return () => {
      ctx.revert();
      if (containerRef.current) {
        const items = containerRef.current.querySelectorAll('.menu-list-item[data-shape]');
        items.forEach((item: any) => item._cleanup && item._cleanup());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasOpenedOnce, groups.length]);

  // Timeline d'ouverture / fermeture — MIROIR de l'original : tous les
  // xPercent horizontaux qui faisaient entrer les panneaux depuis la
  // DROITE sont inversés pour les faire entrer depuis la GAUCHE.
  useEffect(() => {
    if (!hasOpenedOnce || !containerRef.current) return;

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
          // Miroir : xPercent 101 -> 0 devient -101 -> 0 (entrée par la gauche)
          .fromTo(bgPanels, { xPercent: -101 }, { xPercent: 0, stagger: 0.12, duration: 0.575 }, '<')
          .fromTo(menuLinks, { yPercent: 140, rotate: 10 }, { yPercent: 0, rotate: 0, stagger: 0.05 }, '<+=0.35');

        if (fadeTargets.length) {
          tl.fromTo(fadeTargets, { autoAlpha: 0, yPercent: 50 }, { autoAlpha: 1, yPercent: 0, stagger: 0.04, clearProps: 'all' }, '<+=0.2');
        }
      } else {
        // FERMETURE
        if (navWrap) navWrap.setAttribute('data-nav', 'closed');

        tl.to(overlay, { autoAlpha: 0 })
          // Miroir : sortie vers la gauche (-120) au lieu de la droite (120)
          .to(menu, { xPercent: -120 }, '<')
          .to(menuButtonTexts, { yPercent: 0 }, '<')
          .to(menuButtonIcon, { rotate: 0 }, '<')
          .set(navWrap, { display: 'none' });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [isMobileOpen, hasOpenedOnce]);

  if (!hasOpenedOnce) return null;

  const handleNavigate = () => onCloseMobile();

  return (
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
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.appLabel)}
                      className="nav-link"
                      aria-expanded={isOpen}
                    >
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
    </div>
  );
};
