// ============================================================
// src/components/backoffice/fields/InlineCellPopover.tsx
// Popover générique pour l'édition en ligne dans le tableau du
// backoffice — utilisé par InlineSelectField, FkSelectField (mode
// compact) et BackofficeEditableCell (textarea/richtext/tags).
//
// Rendu via un PORTAIL React (`createPortal` vers `document.body`) :
// le conteneur du tableau liste applique `overflow-hidden` /
// `overflow-x-auto` pour ses coins arrondis et son défilement
// horizontal — un panneau positionné en `absolute` à l'intérieur d'une
// cellule y serait rogné. Le portail sort le panneau de ce contexte et
// le positionne en `fixed` à partir des coordonnées réelles du
// déclencheur, tout en gardant le déclencheur lui-même dans le flux du
// tableau (aucun changement de comportement pour le reste de la page).
// ============================================================

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface InlineCellPopoverProps {
  trigger: React.ReactNode;
  triggerClassName?: string;
  disabled?: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Largeur minimale du panneau (défaut : largeur du déclencheur). */
  panelMinWidth?: number;
  panelClassName?: string;
  children: React.ReactNode;
}

interface Coords {
  top: number;
  left: number;
  width: number;
  openUpward: boolean;
}

export const InlineCellPopover: React.FC<InlineCellPopoverProps> = ({
  trigger,
  triggerClassName,
  disabled,
  isOpen,
  onOpenChange,
  panelMinWidth,
  panelClassName,
  children,
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<Coords | null>(null);

  const updateCoords = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const openUpward = rect.bottom > window.innerHeight * 0.65;
    const minWidth = panelMinWidth ?? rect.width;
    const left = Math.min(rect.left, Math.max(8, window.innerWidth - minWidth - 8));
    setCoords({
      top: openUpward ? rect.top - 6 : rect.bottom + 6,
      left,
      width: minWidth,
      openUpward,
    });
  }, [panelMinWidth]);

  useLayoutEffect(() => {
    if (isOpen) updateCoords();
    else setCoords(null);
  }, [isOpen, updateCoords]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleReposition = () => updateCoords();
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onOpenChange(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };

    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onOpenChange, updateCoords]);

  return (
    <>
      <div
        ref={triggerRef}
        className={triggerClassName}
        onClick={() => {
          if (!disabled) onOpenChange(!isOpen);
        }}
      >
        {trigger}
      </div>
      {isOpen && coords &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              minWidth: coords.width,
              transform: coords.openUpward ? 'translateY(-100%)' : undefined,
            }}
            className={`z-40 rounded-xl bg-white dark:bg-[#1A1F4D] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden ${panelClassName ?? ''}`}
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
};
