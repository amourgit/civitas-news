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
// aide, backoffice, profil/connexion) est une pilule `rounded-full`,
// et `rightAction` (bascule sidebar) est un cercle `rounded-full`
// strict -- toutes deux légèrement décollées du bord droit (right-3),
// mais au même niveau vertical que le logo (top-0) : sans wing ni
// raccord de coin, le fond transparent derrière
// la topbar suffit à lui seul à donner des ronds parfaits. Seul le
// logo (à gauche) garde le traitement d'origine (coin découpé, wings).
//
// Toutes les tailles ci-dessus (xl:) sont devenues sm: : desktop ET
// tablette gardent logo + menu central + actions ; en dessous de sm
// (vrai mobile), seul le menu central disparaît (remplacé par
// MobileDock, voir Header.tsx/MobileDock.tsx) -- logo et actions
// restent visibles, dans le même habillage détaché.
// ============================================================

import { forwardRef, useCallback, useId, useLayoutEffect, useRef, useState } from "react";

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
  /** Pilule additionnelle, entièrement injectable par la page active
   *  (voir context/TopbarSlotsContext.tsx), rendue dans le même groupe
   *  détaché que `rightContent`/`rightAction`, juste avant eux. Absente
   *  du DOM tant qu'aucune page n'a rien publié. */
  upperContent?: ReactNode;
  /** Groupe encadré (ex : aide, backoffice, profil/connexion). Flotte
   *  sans toucher le coin de l'écran dès que `rightAction` existe. */
  rightContent?: ReactNode;
  /** Pièce unique détachée (ex : bascule sidebar). C'est TOUJOURS
   *  elle qui occupe le coin réel haut-droit (ou bas-droit) du
   *  viewport quand elle est fournie. */
  rightAction?: ReactNode;
  /** Niveau inférieur de la topbar : une seconde couche fixed, collée
   *  juste sous (ou au-dessus, en position "bottom") le niveau
   *  historique ci-dessus, entièrement injectable par la page active
   *  au même titre que `upperContent` (voir context/TopbarSlotsContext.tsx
   *  et useSetTopbarContent). N'occupe AUCUN espace tant qu'aucune page
   *  n'y publie rien : le compensateur de padding sous `children`
   *  s'ajuste automatiquement selon sa présence, donc les pages qui ne
   *  l'utilisent pas ne voient rigoureusement aucun changement. */
  lowerContent?: ReactNode;
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
  upperContent,
  rightContent,
  rightAction,
  lowerContent,
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

  const hasUpperContent = !!upperContent;
  const hasRightContent = showRightContent && !!rightContent;
  const hasRightAction = showRightAction && !!rightAction;
  const hasLowerContent = !!lowerContent;

  // La topbar n'a plus de hauteur figée en dur (voir plus bas : elle
  // s'ajuste désormais à son contenu). Le padding qui compense sa
  // hauteur sous/sur `children` (pour qu'elle ne le recouvre jamais)
  // doit donc suivre sa hauteur RÉELLE plutôt qu'une valeur supposée à
  // l'avance -- measuredHeight (mise à jour par ResizeObserver, donc
  // automatiquement sur tout changement futur de contenu, breakpoint,
  // etc.) + une même marge de respiration (26px) que l'ancien calcul
  // statique (70px = 44px de topbar + 26px, 126px = 100px + 26px).
  const topbarRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  useLayoutEffect(() => {
    const el = topbarRef.current;
    if (!el) return;
    const update = () => setMeasuredHeight(el.offsetHeight);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Topbar -- fixed, collée aux vrais bords du viewport. Ce
          conteneur n'intercepte lui-même aucun clic : seuls les
          notches individuels le font (pointer-events-auto). Hauteur en
          fit-content (plus aucune valeur figée en dur) : flex-col
          empile simplement le niveau supérieur puis, s'il existe, le
          niveau inférieur -- chacun garde sa hauteur naturelle, et
          measuredHeight (voir plus haut) suit automatiquement le
          résultat. Fond glassmorphism (même traitement que le popup de
          filtres News : bg-white/10 dark:bg-black/20 + backdrop-blur-2xl)
          par-dessus les deux niveaux -- chaque notch garde son propre
          fond opaque par-dessus, inchangé. En position "bottom",
          flex-col-reverse inverse l'ordre VISUEL (le niveau supérieur
          reste collé au bord réel du viewport) sans toucher à l'ordre
          DOM (niveau supérieur toujours codé en premier ci-dessous). */}
      <div
        ref={topbarRef}
        className={cn(
          "pointer-events-none fixed inset-x-0 z-50 flex select-none flex-col bg-white/10 dark:bg-black/20 backdrop-blur-2xl transition-colors duration-200",
          isBottom ? "bottom-0 flex-col-reverse" : "top-0",
          className
        )}
        {...props}
      >
        {/* Niveau supérieur -- trois zones (gauche/milieu/droite) en
            flex, réparties en space-between. Gauche et milieu restent
            en largeur fit-content (shrink-0 : leur taille ne suit que
            leur propre contenu, jamais compressée par la droite) ; la
            droite est plafonnée à 50% de la largeur totale
            (max-w-[50%]). Aucune des trois n'a de hauteur imposée :
            align-items par défaut (stretch) fait que la zone au
            contenu le plus haut détermine la hauteur de la ligne, et
            les deux autres s'étirent pour la suivre -- donc toujours
            alignées entre elles, quel que soit leur contenu respectif. */}
        <div className="relative flex w-full justify-between">
          {/* 1. Logo Notch -- visible à TOUTES les tailles (desktop,
              tablette, mobile), toujours collée au coin gauche réel. */}
          {showLogo && logo && (
            <aside
              aria-label="Brand logo notch"
              className={cn(
                "pointer-events-auto relative flex shrink-0 items-center px-3.5 sm:px-5 bg-[#3B3DD9] transition-colors duration-200",
                isBottom ? "rounded-tr-[24px]" : "rounded-br-[24px]"
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
              "pointer-events-auto relative hidden shrink-0 items-center px-4 bg-[#3B3DD9] text-white transition-colors duration-200 sm:flex",
              isBottom ? "rounded-t-[24px]" : "rounded-b-[24px]"
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

          {/* 3. Right side -- deux pièces détachées, visibles à TOUTES
              les tailles. Zone plafonnée à 50% de la largeur totale
              (max-w-[50%]) et dotée d'un léger padding vertical
              (py-1.5) pour ne jamais coller au haut/bas de la zone une
              fois étirée à la hauteur commune.
                - `rightContent` (aide, backoffice, profil/connexion) et
                  `upperContent` (injecté par la page active, voir
                  TopbarSlotsContext.tsx) : ASIDE volontairement
                  transparent, sans fond ni arrondi propre -- chaque
                  bouton à l'intérieur porte désormais SON PROPRE cercle
                  (bg-[#3B3DD9] rounded-full, taille fixe, voir
                  Header.tsx) et se chevauche horizontalement avec ses
                  voisins (margin négative), même principe visuel que
                  la pile d'avatars des réactions sur les cards News
                  (voir AvatarGroup.tsx) : plusieurs cercles PARFAITS
                  distincts plutôt qu'une seule pilule commune qui les
                  aurait déformés en rectangle aux coins arrondis dès
                  qu'il y en a plus d'un.
                - `rightAction` (bascule sidebar) : même traitement --
                  l'aside ne porte plus le cercle, seul le bouton à
                  l'intérieur (voir sidebarToggleButtonClassName dans
                  Header.tsx) le porte, pour ne jamais afficher deux
                  cercles concentriques de tailles différentes.
              `upperContent` reste toujours affiché EN PREMIER (le plus
              éloigné du bord réel), pour ne jamais déplacer
              rightContent/rightAction que d'autres écrans peuvent
              cibler visuellement de façon stable. */}
          {(hasUpperContent || hasRightContent || hasRightAction) && (
            <div className="pointer-events-none flex max-w-[50%] items-stretch justify-end gap-2.5 py-1.5 sm:gap-3">
              {hasUpperContent && (
                <aside
                  aria-label="Contenu additionnel de la page (niveau supérieur)"
                  className="pointer-events-auto flex items-center text-white"
                >
                  {upperContent}
                </aside>
              )}

              {hasRightContent && (
                <aside aria-label="User actions notch" className="pointer-events-auto flex items-center text-white">
                  {rightContent}
                </aside>
              )}

              {/* 4. Sidebar Action Notch -- toujours seule dans son
                  propre cercle. */}
              {hasRightAction && (
                <aside
                  aria-label="Sidebar action notch"
                  className="pointer-events-auto flex items-center justify-center text-white"
                >
                  {rightAction}
                </aside>
              )}
            </div>
          )}
        </div>

        {/* Niveau inférieur -- seconde couche de la topbar, collée
            juste sous (ou au-dessus, en position "bottom") le niveau
            supérieur ci-dessus : dans le flux normal du flex-col
            parent désormais (plus une position absolue calculée à la
            main sur une hauteur supposée), elle suit donc TOUJOURS la
            hauteur RÉELLE du niveau supérieur, même si celle-ci change.
            N'existe dans le DOM que si une page a publié du contenu
            dedans (voir hasLowerContent) -- les pages qui n'y touchent
            pas ne voient donc aucune barre vide ni aucun changement de
            mise en page.
            Fond transparent (comme le reste de la topbar depuis la
            suppression du calque plein écran) : seuls deux petits
            accents arrondis à gauche (même composant, même couleur
            #3B3DD9 que le niveau supérieur, voir NotchCornerLeftWing
            plus haut) ET une bordure pleine largeur (vers le niveau
            supérieur) assurent la continuité visuelle, sans dupliquer
            son remplissage plein. */}
        {hasLowerContent && (
          <div
            className={cn(
              "pointer-events-none relative h-14 w-full border-[#3B3DD9] transition-colors duration-200",
              isBottom ? "border-t-2" : "border-b-2"
            )}
          >
            {/* L'accent de continuité qui se trouvait ici, côté niveau
                supérieur, a été retiré : le logo (niveau supérieur)
                porte déjà son propre NotchCornerLeftWing pour ce
                raccord (voir plus haut) -- le dupliquer ici était
                redondant avec ce que le logo gère déjà. Seul reste
                l'accent opposé ci-dessous, là où la ligne du bas se
                termine à gauche. */}
            <div className={cn("absolute left-0 h-0 w-0", isBottom ? "top-0" : "bottom-0")}>
              <NotchCornerLeftWing position={isBottom ? "top" : "bottom"} />
            </div>

            {/* Contenu injecté par la page active (voir
                useSetTopbarContent('lower', ...)) -- aligné sur la même
                largeur de colonne (max-w-7xl) que le contenu principal
                de l'app (voir App.tsx) pour rester cohérent visuellement
                avec ce qui défile juste en dessous, tout en laissant la
                page entièrement libre de ce qu'elle y place. */}
            <div className="pointer-events-auto mx-auto flex h-full w-full max-w-7xl items-center px-3.5 sm:px-5">
              {lowerContent}
            </div>
          </div>
        )}
      </div>

      {/* Contenu de page -- flux normal du document (le défilement
          redevient celui de la fenêtre, voir ScrollToTop.tsx), sans
          fond ni arrondi imposés : App.tsx reste seul responsable du
          fond par défaut, et chaque page peut poser le sien par-dessus
          sans rien avoir à contourner. Le padding compense la hauteur
          RÉELLE mesurée de la topbar (measuredHeight, voir plus haut) +
          26px de respiration (même marge que l'ancien calcul statique
          70px/126px) -- suit donc n'importe quel changement de contenu
          futur au lieu de supposer une hauteur fixe. Tant que la mesure
          n'est pas encore posée (tout premier rendu), on retombe sur
          l'ancien padding statique (17.5 = 70px) pour ne rien laisser
          d'incorrect le temps que l'effet se déclenche. */}
      <div
        className={cn("w-full", isBottom ? "pt-3 pb-17.5" : "pt-17.5 pb-3")}
        style={
          measuredHeight
            ? isBottom
              ? { paddingBottom: measuredHeight + 26 }
              : { paddingTop: measuredHeight + 26 }
            : undefined
        }
      >
        {children}
      </div>
    </>
  );
}
