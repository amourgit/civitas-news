import { useState, useEffect } from 'react';

/**
 * État de la sidebar backoffice, partagé entre la topbar (Header.tsx, à
 * gauche du logo, visible pour les admins), la barre mobile de
 * BackofficeLayout.tsx et BackofficeSidebar.tsx elle-même. Même pattern
 * observable que ui.store.ts / bottomSheet.store.ts.
 *
 * Deux notions bien distinctes, toutes deux nécessaires :
 * - isCollapsed : desktop uniquement -- colonne repliée en rail
 *   d'icônes (w-16) ou pleine largeur (w-64). La colonne desktop reste
 *   TOUJOURS visible, ce toggle ne change que sa largeur.
 * - isMobileOpen : mobile uniquement -- tiroir hors-écran affiché ou
 *   non (la colonne desktop est `hidden` en dessous du breakpoint sm,
 *   donc isCollapsed n'y a aucun effet visible).
 * Les deux vivaient avant dans des états séparés (isCollapsed ici,
 * isMobileNavOpen en useState local de BackofficeLayout.tsx) : la
 * topbar ne pouvait donc agir que sur isCollapsed, sans aucun effet sur
 * mobile où seul isMobileOpen compte. D'où le bouton topbar qui ne
 * faisait rien sur mobile, alors que le bouton du corps (qui appelait
 * directement le setter local) fonctionnait. Un seul store pour les
 * deux -- Header.tsx choisit lequel actionner selon le viewport (voir
 * useMediaQuery côté appelant).
 */
let isCollapsed = false;
let isMobileOpen = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function useBackofficeSidebarStore() {
  const [state, setState] = useState({ isCollapsed, isMobileOpen });

  useEffect(() => {
    const handleChange = () => setState({ isCollapsed, isMobileOpen });
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const toggle = () => {
    isCollapsed = !isCollapsed;
    notify();
  };

  const openMobile = () => {
    isMobileOpen = true;
    notify();
  };

  const closeMobile = () => {
    isMobileOpen = false;
    notify();
  };

  const toggleMobile = () => {
    isMobileOpen = !isMobileOpen;
    notify();
  };

  return {
    isCollapsed: state.isCollapsed,
    toggle,
    isMobileOpen: state.isMobileOpen,
    openMobile,
    closeMobile,
    toggleMobile,
  };
}
