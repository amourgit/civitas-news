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
//
// ------------------------------------------------------------
// Refonte structurelle (topbar détachée, autonome et fixed) :
// ------------------------------------------------------------
// Avant : NotchNav enveloppait TOUTE l'app dans un calque plein écran
// (`fixed inset-0 ... p-0 md:p-2`) + une boîte interne arrondie
// (`rounded-2xl bg-[#F7F8FC] dark:bg-[#0E1338]`) contenant elle-même
// le seul conteneur scrollable de l'app (`#notch-nav-scroll-viewport`,
// voir aussi ScrollToTop.tsx). Ce calque créait un "contour" violet
// visible autour du contenu (le padding `md:p-2`), dupliquait le fond
// déjà posé par App.tsx, et empêchait les pages de définir leur propre
// arrière-plan (tout passait forcément par cette boîte).
//
// Maintenant : NotchNav ne rend QUE la topbar (les notches), en
// `fixed` sur les vrais bords du viewport (aucun calque, aucun
// padding, aucun "vide" visible). `children` est rendu dans un simple
// conteneur en flux normal juste après, sans fond ni arrondi imposés
// -- le défilement redevient celui du document (voir ScrollToTop.tsx),
// et chaque page/l'app (voir App.tsx) reste seule responsable de son
// arrière-plan.
//
// Le bloc "action" à droite est désormais scindé en DEUX pièces
// détachées au lieu d'une seule : `rightContent` (groupe encadré --
// aide, backoffice, profil/connexion) flotte sans toucher le coin, et
// `rightAction` (bascule sidebar) est la pièce qui occupe réellement
// le coin haut-droit (wing d'angle). Toutes les tailles ci-dessus
// (xl:) sont devenues sm: : desktop ET tablette gardent logo + menu
// central + actions ; en dessous de sm (vrai mobile), seul le menu
// central disparaît (remplacé par MobileDock, voir Header.tsx/
// MobileDock.tsx) -- logo et actions restent visibles, dans le même
// habillage détaché.
// ============================================================

import { forwardRef, useCallback, useId, useState } from "react";

import { LayoutGroup, motion } from "motion/react";

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

export interface NotchNavProps extends HTMLAttributes<HTMLDivElement> {
  items: NotchItemData[];
  activeId?: string;
  defaultActiveId?: string;
  position?: NotchPosition;
  logo?: ReactNode;
  /** Groupe encadré (ex : aide, backoffice, profil/connexion). Flotte
   *  sans toucher le coin de l'écran dès que `rightAction` existe. */
  rightContent?: ReactNode;
  /** Pièce unique détachée (ex : bascule sidebar). C'est TOUJOURS
   *  elle qui occupe le coin réel haut-droit (ou bas-droit) du
   *  viewport quand elle est fournie. */
  rightAction?: ReactNode;
  showLogo?: boolean;
  showRightContent?: boolean;
  showRightAction?: boolean;
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
  rightAction,
  showLogo = true,
  showRightContent = true,
  showRightAction = true,
  children,
  onActiveChange,
  className,
  ...props
}: NotchNavProps) {
  const layoutGroupId = useId();

  const [internalActiveId, setInternalActiveId] = useState<string>(
    defaultActiveId || items[0]?.id || ""
  );

  const isBottom = position === "bottom";

  const activeId =
    controlledActiveId !== undefined
      ? controlledActiveId
      : internalActiveId;

  const handleSelect = useCallback(
    (id: string) => {
      if (controlledActiveId === undefined) {
        setInternalActiveId(id);
      }
      onActiveChange?.(id);
    },
    [controlledActiveId, onActiveChange]
  );

  const hasRightContent = showRightContent && !!rightContent;
  const hasRightAction = showRightAction && !!rightAction;

  return (
    <>
      {/* Topbar -- fixed, collée aux vrais bords du viewport. Ce
          conteneur n'a lui-même AUCUNE hauteur (les notches sont en
          `absolute` dedans) et n'intercepte aucun clic : seuls les
          notches individuels sont cliquables (pointer-events-auto). */}
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 z-50 select-none transition-colors duration-200",
          isBottom ? "bottom-0" : "top-0",
          className
        )}
        {...props}
      >
        {/* 1. Logo Notch -- visible à TOUTES les tailles (desktop,
            tablette, mobile), toujours collée au coin gauche réel. */}
        {showLogo && logo && (
          <aside
            aria-label="Brand logo notch"
            className={cn(
              "pointer-events-auto absolute left-0 flex items-center h-10 px-3.5 sm:px-5 bg-[#3B3DD9] transition-colors duration-200",
              isBottom ? "bottom-0 rounded-tr-[24px]" : "top-0 rounded-br-[24px]"
            )}
          >
            <div className="flex items-center text-white">{logo}</div>

            <NotchRightWing position={position} />

            <NotchCornerLeftWing position={position} />
          </aside>
        )}

        {/* 2. Center Menu Notch -- desktop ET tablette (sm et plus).
            En dessous de sm (vrai mobile), disparaît : MobileDock
            prend le relais pour la navigation principale (voir
            Header.tsx / MobileDock.tsx). */}
        <header
          role="tablist"
          aria-orientation="horizontal"
          className={cn(
            "pointer-events-auto hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center h-11 px-4 bg-[#3B3DD9] text-white transition-colors duration-200",
            isBottom ? "bottom-0 rounded-t-[24px]" : "top-0 rounded-b-[24px]"
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

        {/* 3. Right side -- deux pièces DÉTACHÉES, visibles à TOUTES
            les tailles :
              - `rightContent` (groupe encadré : aide, backoffice,
                profil/connexion) flotte SANS toucher le coin dès que
                `rightAction` existe à côté (wings + arrondi
                symétriques, comme le menu central).
              - `rightAction` (bascule sidebar) est TOUJOURS la pièce
                qui occupe le coin réel (wing d'angle + arrondi
                coupé), pour qu'un bord droit ne reste jamais "carré"
                contre l'écran.
            Si une seule des deux existe, elle hérite seule du
            traitement "coin". w-fit partout : la largeur suit le
            contenu (icônes variables selon le rôle), jamais figée. */}
        {(hasRightContent || hasRightAction) && (
          <div
            className={cn(
              "pointer-events-none absolute right-0 flex items-start gap-2 sm:gap-2.5",
              isBottom ? "bottom-0" : "top-0"
            )}
          >
            {hasRightContent && (
              <aside
                aria-label="User actions notch"
                className={cn(
                  "pointer-events-auto flex h-10 w-fit items-center bg-[#3B3DD9] text-white transition-colors duration-200",
                  hasRightAction ? "px-4 sm:px-5" : "pl-3.5 pr-4 sm:pl-5 sm:pr-6",
                  isBottom
                    ? hasRightAction
                      ? "rounded-t-[24px]"
                      : "rounded-tl-[24px]"
                    : hasRightAction
                      ? "rounded-b-[24px]"
                      : "rounded-bl-[24px]"
                )}
              >
                <NotchLeftWing position={position} />

                {hasRightAction ? (
                  <NotchRightWing position={position} />
                ) : (
                  <NotchCornerRightWing position={position} />
                )}

                <div className="flex w-fit shrink-0 items-center">{rightContent}</div>
              </aside>
            )}

            {/* 4. Sidebar Action Notch -- toujours seule dans son
                cadre, toujours au coin réel. */}
            {hasRightAction && (
              <aside
                aria-label="Sidebar action notch"
                className={cn(
                  "pointer-events-auto flex h-10 w-fit items-center pl-3.5 pr-4 sm:pl-4 sm:pr-5 bg-[#3B3DD9] text-white transition-colors duration-200",
                  isBottom ? "bottom-0 rounded-tl-[24px]" : "top-0 rounded-bl-[24px]"
                )}
              >
                <NotchLeftWing position={position} />

                <NotchCornerRightWing position={position} />

                <div className="flex w-fit shrink-0 items-center">{rightAction}</div>
              </aside>
            )}
          </div>
        )}
      </div>

      {/* Contenu de page -- flux normal du document (le défilement
          redevient celui de la fenêtre, voir ScrollToTop.tsx), sans
          fond ni arrondi imposés : App.tsx reste seul responsable du
          fond par défaut, et chaque page peut poser le sien par-dessus
          sans rien avoir à contourner. Le padding compense uniquement
          la hauteur de la topbar fixed pour qu'elle ne recouvre jamais
          le contenu. */}
      <div className={cn("w-full", isBottom ? "pt-3 pb-17.5" : "pt-17.5 pb-3")}>
        {children}
      </div>
    </>
  );
}
