import { useState, useEffect } from 'react';

/**
 * État de repli de la sidebar backoffice (rail d'icônes ou colonne
 * complète), partagé entre le bouton de la topbar (Header.tsx, à gauche
 * du logo, visible pour les admins) et BackofficeSidebar.tsx elle-même.
 * Même pattern observable que ui.store.ts / bottomSheet.store.ts.
 */
let isCollapsed = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function useBackofficeSidebarStore() {
  const [collapsed, setCollapsed] = useState(isCollapsed);

  useEffect(() => {
    const handleChange = () => setCollapsed(isCollapsed);
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const toggle = () => {
    isCollapsed = !isCollapsed;
    notify();
  };

  return { isCollapsed: collapsed, toggle };
}
