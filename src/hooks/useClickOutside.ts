// ============================================================
// src/hooks/useClickOutside.ts
// Ferme un panneau (popover, dropdown...) au clic en dehors de son
// ref. Extrait de EditorToolbar.tsx pour être partagé avec les autres
// popovers de l'éditeur (ex: TableFloatingControls).
// ============================================================

import { useEffect, useRef } from 'react';

export function useClickOutside<T extends HTMLElement = HTMLDivElement>(onOutside: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onOutside]);
  return ref;
}
