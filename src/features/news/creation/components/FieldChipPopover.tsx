// ============================================================
// src/features/news/creation/components/FieldChipPopover.tsx
// Brique de base de la rangée de métadonnées (voir MetaFieldsRow.tsx) :
// une pastille compacte (icône + libellé + valeur courante) qui ouvre
// un panneau flottant au clic. La rangée qui l'accueille défile
// horizontalement (`overflow-x-auto`, voir .no-scrollbar dans
// index.css) -- un panneau simplement `absolute` par rapport à la
// pastille serait donc rogné par ce conteneur dès qu'il dépasse sa
// hauteur. Le panneau est donc porté (createPortal) dans document.body
// et positionné en `fixed` à partir des coordonnées RÉELLES de la
// pastille (getBoundingClientRect, même technique que le clone du
// bouton de sidebar dans components/layout/Header.tsx), recalculées à
// chaque scroll/resize tant qu'il est ouvert.
// ============================================================

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown } from 'lucide-react';

export interface FieldChipPopoverProps {
  icon: LucideIcon;
  /** Libellé du champ (affiché en tête du panneau + lu par les lecteurs d'écran). */
  label: string;
  /** Ce qui s'affiche sur la pastille elle-même (valeur courante ou placeholder). */
  valueLabel: React.ReactNode;
  /** Vrai dès qu'une valeur réelle est posée -- change l'habillage (neutre -> teinté violet). */
  filled?: boolean;
  /** Astérisque discret si le champ est requis et vide. */
  required?: boolean;
  disabled?: boolean;
  panelClassName?: string;
  /** Reçoit une fonction `close` à appeler après une sélection ponctuelle (ex: choisir une catégorie referme le panneau ; un champ texte libre préfère ne jamais l'appeler). */
  children: (close: () => void) => React.ReactNode;
}

export const FieldChipPopover: React.FC<FieldChipPopoverProps> = ({
  icon: Icon,
  label,
  valueLabel,
  filled = false,
  required = false,
  disabled = false,
  panelClassName = '',
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const reposition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const panelWidth = panelRef.current?.offsetWidth ?? 280;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - panelWidth - 8);
    setCoords({ top: rect.bottom + 8, left });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    reposition();
    const onScroll = () => reposition();
    const onResize = () => reposition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [isOpen, reposition]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const close = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-label={label}
        className={`group flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          filled
            ? 'bg-[#5B4DFF]/10 border-[#5B4DFF]/25 text-[#4739E0] dark:text-[#B8AFFF]'
            : 'bg-black/[0.035] dark:bg-white/[0.06] border-transparent text-gray-600 dark:text-gray-300 hover:bg-black/[0.06] dark:hover:bg-white/[0.1]'
        } ${isOpen ? 'ring-2 ring-[#5B4DFF]/30' : ''}`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
        <span className="max-w-[9rem] truncate">{valueLabel}</span>
        {required && !filled && <span className="w-1 h-1 rounded-full bg-[#5B4DFF]" aria-hidden="true" />}
        <ChevronDown className={`w-3 h-3 shrink-0 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && coords &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={label}
            style={{ top: coords.top, left: coords.left }}
            className={`fixed z-[70] w-72 max-w-[calc(100vw-1rem)] max-h-[70vh] overflow-y-auto rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1A1F4D] shadow-xl shadow-black/10 dark:shadow-black/40 p-3 animate-in fade-in zoom-in-95 duration-100 ${panelClassName}`}
          >
            <p className="px-1 pb-2 text-[11px] font-semibold text-gray-400">{label}</p>
            {children(close)}
          </div>,
          document.body,
        )}
    </>
  );
};

/** Ligne d'option standard à l'intérieur d'un panneau (liste de choix simples). */
export const FieldOptionRow: React.FC<{
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  swatch?: string;
}> = ({ active, onClick, children, swatch }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium transition-colors ${
      active
        ? 'bg-[#5B4DFF]/10 text-[#4739E0] dark:text-[#B8AFFF]'
        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'
    }`}
  >
    {swatch && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: swatch }} />}
    <span className="truncate">{children}</span>
  </button>
);
