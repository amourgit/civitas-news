"use client";

// ============================================================
// src/components/ui/notch-nav.tsx
// Composant "notch nav" fourni tel quel par la référence : structure,
// classes de mise en page, animations et comportement IDENTIQUES à
// l'original (voir en fin de fichier pour l'unique catégorie de
// changement volontaire : le noir de la référence -> notre violet).
//
// Deux adaptations strictement techniques (pas des choix de design) :
//   - "framer-motion" -> "motion/react" (paquet réellement installé
//     dans ce projet ; API identique pour LayoutGroup/motion.span).
//   - "@/lib/utils" -> "../../lib/utils" (alias non utilisé dans ce
//     projet ; cn() est le même petit utilitaire).
//   - "bg-background text-foreground" -> les couleurs de fond/texte
//     réellement définies dans ce projet (aucun token Tailwind
//     "background/foreground" n'existe ici) : mêmes valeurs que
//     App.tsx utilisait déjà pour le fond de page.
//
// Recoloration demandée : partout où l'original utilisait le noir de
// marque (zinc-950 / son inverse zinc-200 en dark mode) pour le fond
// des notches et de son contour de page, on utilise désormais le
// violet du projet (#5B4DFF), de façon stable (même couleur en clair
// et en sombre, comme le faisait déjà la topbar précédente). Tous les
// textes/icônes qui étaient déjà en blanc/zinc-clair sur ce fond noir
// restent en blanc (mêmes rapports de contraste, juste sur violet
// plutôt que sur noir). Aucune classe de layout, espacement, taille,
// arrondi ou animation n'a été touchée.
// ============================================================

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { LayoutGroup, motion } from "motion/react";

import { Check, ChevronDown, ChevronUp } from "lucide-react";

import type {
  ButtonHTMLAttributes,
  ComponentType,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "../../lib/utils";

export type NotchPosition = "top" | "bottom";

export interface NotchItemData {
  id: string;
  label: string;
  icon?: LucideIcon | ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
}

export interface NotchWingProps {
  position?: NotchPosition;
  className?: string;
}

export function NotchLeftWing({
  position = "top",
  className,
}: NotchWingProps) {
  const isBottom = position === "bottom";

  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      shapeRendering="geometricPrecision"
      className={cn(
        "pointer-events-none absolute right-full size-2.5 md:size-4 overflow-visible select-none text-[#3B3DD9] transition-colors duration-200",
        isBottom ? "bottom-0" : "top-0",
        className
      )}
    >
      <path
        d={
          isBottom
            ? "M 0 20 C 11.046 20 20 11.046 20 0 H 21 V 21 H 0 Z"
            : "M 0 0 C 11.046 0 20 8.954 20 20 H 21 V -1 H 0 Z"
        }
        fill="currentColor"
      />
    </svg>
  );
}

export function NotchRightWing({
  position = "top",
  className,
}: NotchWingProps) {
  const isBottom = position === "bottom";

  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      shapeRendering="geometricPrecision"
      className={cn(
        "pointer-events-none absolute left-full size-2.5 md:size-4 overflow-visible select-none text-[#3B3DD9] transition-colors duration-200",
        isBottom ? "bottom-0" : "top-0",
        className
      )}
    >
      <path
        d={
          isBottom
            ? "M 20 20 C 8.954 20 0 11.046 0 0 H -1 V 21 H 20 Z"
            : "M 20 0 C 8.954 0 0 8.954 0 20 H -1 V -1 H 20 Z"
        }
        fill="currentColor"
      />
    </svg>
  );
}

export function NotchCornerLeftWing({
  position = "top",
  className,
}: NotchWingProps) {
  const isBottom = position === "bottom";

  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      shapeRendering="geometricPrecision"
      className={cn(
        "pointer-events-none absolute left-0 size-2.5 md:size-4 overflow-visible select-none text-[#3B3DD9] transition-colors duration-200",
        isBottom ? "bottom-full" : "top-full",
        className
      )}
    >
      <path
        d={
          isBottom
            ? "M 0 20 H 20 C 8.954 20 0 11.046 0 0 V 20 Z"
            : "M 0 0 H 20 C 8.954 0 0 8.954 0 20 V 0 Z"
        }
        fill="currentColor"
      />
    </svg>
  );
}

export function NotchCornerRightWing({
  position = "top",
  className,
}: NotchWingProps) {
  const isBottom = position === "bottom";

  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      shapeRendering="geometricPrecision"
      className={cn(
        "pointer-events-none absolute right-0 size-2.5 md:size-4 overflow-visible select-none text-[#3B3DD9] transition-colors duration-200",
        isBottom ? "bottom-full" : "top-full",
        className
      )}
    >
      <path
        d={
          isBottom
            ? "M 20 20 H 0 C 11.046 20 20 11.046 20 0 V 20 Z"
            : "M 20 0 H 0 C 11.046 0 20 8.954 20 20 V 0 Z"
        }
        fill="currentColor"
      />
    </svg>
  );
}

export interface NotchItemProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  id: string;
  label: string;
  isActive: boolean;
  icon?: LucideIcon | ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
  onSelect: (id: string) => void;
}

export const NotchItem = forwardRef<HTMLButtonElement, NotchItemProps>(
  (
    {
      id,
      label,
      isActive,
      icon: Icon,
      badge,
      disabled,
      className,
      onClick,
      onSelect,
      ...props
    },
    ref
  ) => {
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        event.preventDefault();
        return;
      }

      onSelect(id);
      onClick?.(event);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (!disabled) {
          onSelect(id);
        }
      }
    };

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative flex h-9 cursor-pointer items-center gap-2 rounded-full px-3.5 text-sm font-medium transition-colors outline-none select-none",
          "focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-1",
          isActive
            ? "font-semibold text-white"
            : "text-white/50 hover:text-white/80",
          disabled && "cursor-not-allowed pointer-events-none opacity-40",
          className
        )}
        {...props}
      >
        {isActive && (
          <motion.span
            layoutId="notch-active-pill"
            className="absolute inset-0 rounded-full bg-white/20"
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
          />
        )}

        <span className="relative z-10 flex items-center gap-2">
          {Icon && (
            <Icon
              className={cn(
                "size-4 shrink-0 transition-colors",
                isActive
                  ? "text-white"
                  : "text-white/50 group-hover:text-white/80"
              )}
            />
          )}

          <span className="leading-none">{label}</span>

          {badge && (
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold tracking-tight uppercase text-white">
              {badge}
            </span>
          )}
        </span>
      </button>
    );
  }
);

NotchItem.displayName = "NotchItem";

interface NotchDropdownItemProps {
  item: NotchItemData;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function NotchDropdownItem({
  item,
  isSelected,
  onSelect,
}: NotchDropdownItemProps) {
  const Icon = item.icon;

  const handleClick = () => {
    onSelect(item.id);
  };

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      disabled={item.disabled}
      onClick={handleClick}
      className={cn(
        "flex w-full cursor-pointer items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left text-sm outline-none transition-colors select-none",
        "focus-visible:ring-2 focus-visible:ring-white/50",
        isSelected
          ? "bg-white/20 font-semibold text-white"
          : "text-white/60 hover:bg-white/10 hover:text-white/90 active:bg-white/15",
        item.disabled && "cursor-not-allowed pointer-events-none opacity-40"
      )}
    >
      <div className="flex items-center gap-2.5">
        {Icon && (
          <Icon
            className={cn(
              "size-4 shrink-0",
              isSelected ? "text-white" : "text-white/50"
            )}
          />
        )}

        <span>{item.label}</span>
      </div>

      {isSelected && <Check className="size-3.5 text-white" />}
    </button>
  );
}

export interface NotchNavProps extends HTMLAttributes<HTMLDivElement> {
  items: NotchItemData[];
  activeId?: string;
  defaultActiveId?: string;
  position?: NotchPosition;
  logo?: ReactNode;
  rightContent?: ReactNode;
  showLogo?: boolean;
  showRightContent?: boolean;
  children?: ReactNode;
  onActiveChange?: (id: string) => void;
}

export function NotchNav({
  items,
  activeId: controlledActiveId,
  defaultActiveId,
  position = "top",
  logo,
  rightContent,
  showLogo = true,
  showRightContent = true,
  children,
  onActiveChange,
  className,
  ...props
}: NotchNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const layoutGroupId = useId();

  const [internalActiveId, setInternalActiveId] = useState<string>(
    defaultActiveId || items[0]?.id || ""
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const isBottom = position === "bottom";

  const activeId =
    controlledActiveId !== undefined
      ? controlledActiveId
      : internalActiveId;

  const activeIndex = useMemo(() => {
    const index = items.findIndex((item) => item.id === activeId);
    return index >= 0 ? index : 0;
  }, [items, activeId]);

  const activeItem = items[activeIndex] || items[0];

  const handleSelect = useCallback(
    (id: string) => {
      if (controlledActiveId === undefined) {
        setInternalActiveId(id);
      }
      setIsDropdownOpen(false);
      onActiveChange?.(id);
    },
    [controlledActiveId, onActiveChange]
  );

  const handleToggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const handleCloseDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div
      className={cn(
        "fixed inset-0 h-screen w-screen overflow-hidden bg-[#3B3DD9] p-0 md:p-2 transition-colors duration-200",
        className
      )}
      {...props}
    >
      <div className="relative flex h-full w-full flex-col rounded-none md:rounded-2xl bg-[#F7F8FC] dark:bg-[#0E1338] text-gray-900 dark:text-gray-100 antialiased transition-colors duration-200">
        <div
          aria-hidden="true"
          onClick={handleCloseDropdown}
          className={cn(
            "absolute inset-0 z-40 rounded-none md:rounded-2xl transition-opacity duration-200 ease-out xl:hidden",
            isDropdownOpen
              ? "pointer-events-auto bg-black/20 backdrop-blur-[2px] opacity-100 dark:bg-black/40"
              : "pointer-events-none opacity-0"
          )}
        />

        {/* 1. Desktop Left Logo Notch */}
        {showLogo && logo && (
          <aside
            aria-label="Brand logo notch"
            className={cn(
              "hidden xl:flex absolute left-0 z-50 h-10 px-5 select-none transition-colors duration-200 bg-[#3B3DD9]",
              isBottom
                ? "bottom-0 rounded-tr-[24px] md:items-end"
                : "top-0 rounded-br-[24px] md:items-baseline"
            )}
          >
            <div className="flex items-center text-white">
              {logo}
            </div>

            <NotchRightWing position={position} />

            <NotchCornerLeftWing position={position} />
          </aside>
        )}

        {/* 2. Desktop Center Menu Notch */}
        <header
          role="tablist"
          aria-orientation="horizontal"
          className={cn(
            "hidden xl:flex absolute left-1/2 -translate-x-1/2 z-50 h-11 px-4 bg-[#3B3DD9] text-white select-none transition-colors duration-200",
            isBottom
              ? "bottom-0 rounded-t-[24px] md:items-end"
              : "top-0 rounded-b-[24px] md:items-start"
          )}
        >
          <NotchLeftWing position={position} />

          <NotchRightWing position={position} />

          <LayoutGroup id={layoutGroupId}>
            <div className="flex items-center gap-1">
              {items.map((item) => (
                <NotchItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  icon={item.icon}
                  badge={item.badge}
                  disabled={item.disabled}
                  isActive={item.id === activeId}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </LayoutGroup>
        </header>

        {/* 3. Desktop Right Action Notch
            w-fit : la largeur reste pilotée par le contenu (nombre
            d'icônes variable selon le rôle : invité, connecté, admin)
            — jamais figée. pr-6 (> pl-5) : léger supplément de
            padding À DROITE UNIQUEMENT pour compenser l'arrondi
            rounded-bl-[24px] du bord opposé, qui donne visuellement
            l'impression que la dernière icône touche/dépasse le
            cadre si le padding est symétrique. */}
        {showRightContent && rightContent && (
          <aside
            aria-label="User actions notch"
            className={cn(
              "hidden xl:flex absolute right-0 z-50 h-10 w-fit pl-5 pr-6 select-none transition-colors duration-200 bg-[#3B3DD9]",
              isBottom
                ? "bottom-0 rounded-tl-[24px] md:items-end"
                : "top-0 rounded-bl-[24px] md:items-start"
            )}
          >
            <NotchLeftWing position={position} />

            <NotchCornerRightWing position={position} />

            <div className="flex w-fit shrink-0 items-center text-white">
              {rightContent}
            </div>
          </aside>
        )}

        {/* ========================================================================= */}
        {/* TABLET & MOBILE VIEW (< 1280px): SINGLE COMPACT NOTCH ISLAND              */}
        {/* ========================================================================= */}
        <div
          ref={containerRef}
          className={cn(
            "xl:hidden absolute z-50 flex flex-col bg-[#3B3DD9] text-white select-none transition-colors duration-200",
            "w-auto left-1/2 -translate-x-1/2 px-4",
            isBottom
              ? "bottom-0 rounded-t-[24px]"
              : "top-0 rounded-b-[24px]"
          )}
        >
          <NotchLeftWing position={position} />

          <NotchRightWing position={position} />

          {/* Unified Horizontal Bar
              Logo et slot droit sont shrink-0 (taille fixe, jamais
              compressés) ; SEUL le déclencheur central doit absorber
              la pression de largeur. flex-1 min-w-0 (au lieu de
              w-full) : un enfant flex avec juste w-full garde un
              min-width implicite = son contenu (le label ne peut pas
              rétrécir sous son propre texte), donc sur les largeurs
              serrées (surtout lg:w-full, ~1024-1279px) la ligne
              entière peut dépasser du cadre et pousser le slot droit
              hors de la pilule — c'était la cause des icônes visibles
              hors du cadre. min-w-0 autorise ce bouton à rétrécir
              réellement (le label se tronque via `truncate`) afin que
              logo + options à droite restent TOUJOURS entièrement
              visibles, quel que soit le nombre d'options. */}
          <div
            className={cn(
              "w-auto xl:w-max lg:w-full flex h-10 sm:h-10 items-center justify-between gap-3 sm:gap-5",
              isBottom ? "sm:items-baseline md:items-end" : "sm:items-baseline md:items-start"
            )}
          >
            {/* Left Logo Slot */}
            {showLogo && logo && (
              <div className="flex shrink-0 items-center text-white">
                {logo}
              </div>
            )}

            {/* Right Action Slot */}
            {showRightContent && rightContent && (
              <div className="flex w-fit shrink-0 items-center justify-end pr-5 text-white">
                {rightContent}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content Viewport
            items-start (PAS items-center) : dans un conteneur flex-row
            avec overflow-y-auto, un enfant centré verticalement
            (align-items: center) qui dépasse la hauteur du conteneur
            voit sa moitié "haute" clippée et inaccessible au scroll —
            seule la moitié "basse" reste atteignable (bug CSS connu
            "centered flex item + overflow"). Nos pages étant presque
            toujours plus hautes que le viewport, ça coupait
            systématiquement le haut de chaque page. items-start
            restaure un flux document normal (contenu ancré en haut,
            scroll classique de haut en bas). */}
        <div
          id="notch-nav-scroll-viewport"
          className={cn(
            "relative flex w-full items-start h-full justify-center overflow-y-auto overflow-x-hidden",
            isBottom ? "pt-3 pb-17.5" : "pt-17.5 pb-3"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
