import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

/** Seuil sous lequel le bouton flottant et ses options passent au petit format (breakpoint `sm` de Tailwind). */
const MOBILE_BREAKPOINT = 640;

/**
 * Verre dépoli partagé par le déclencheur ET les options du menu --
 * volontairement IDENTIQUE entre les deux (même fond translucide, même
 * flou, même bordure, même ombre), comme demandé.
 * AUCUNE variante `dark:` ici à dessein : le bouton flottant ne doit
 * pas réagir au thème clair/sombre du site (contrairement au reste de
 * l'UI) -- teinte volontairement sombre pour garantir un contraste
 * correct avec les icônes blanches, quel que soit le contenu affiché
 * en dessous (page claire ou sombre).
 */
const GLASS_SURFACE =
  'bg-black/25 backdrop-blur-xl backdrop-saturate-150 border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.35)]';

/** Reclampe au resize/à la rotation d'écran, pas seulement au montage. */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

// ============================================================
// src/components/layout/fab/MenuPrimitives.tsx
// Port du composant fourni -- animation d'expansion (clipPath, easing,
// zIndex, translateY) inchangée. Changements par rapport à l'original :
//  1. Retrait de "use client" (directive Next.js, sans effet et sans
//     équivalent dans cette stack Vite).
//  2. MenuContainer.isExpanded/onToggle sont désormais optionnellement
//     CONTRÔLABLES depuis l'extérieur (sinon comportement interne
//     inchangé) -- nécessaire pour que QuickActionsFab.tsx puisse
//     refermer le menu au début d'un drag et piloter l'ouverture
//     depuis le wrapper de positionnement, sans toucher au rendu ni à
//     l'animation ci-dessous.
//  3. Sens d'ouverture vers le HAUT (bouton ancré en bas de l'écran) :
//     translateY passe en négatif.
//  4. Format réduit en mobile (< MOBILE_BREAKPOINT) pour le déclencheur
//     ET les options -- taille ET pas d'empilement (stackGap) réduits
//     dans la même proportion, sinon les cercles se chevaucheraient mal
//     à l'ouverture. Voir aussi BUTTON_SIZE dynamique dans
//     QuickActionsFab.tsx, qui doit suivre la même taille pour que le
//     drag/ancrage aux bords reste pixel-perfect.
//  5. Fond passé en verre dépoli (GLASS_SURFACE), strictement identique
//     entre le déclencheur et les options -- remplace l'ancien fond
//     plat `bg-gray-100 dark:bg-gray-800`.
//  6. Bouton volontairement INDÉPENDANT du thème clair/sombre : plus
//     aucune classe `dark:` sur GLASS_SURFACE ni sur la couleur du
//     texte/icône (fixée en blanc). Centrage de l'icône corrigé --
//     l'ancien `mt-[5%]` (hérité du composant fourni, pensé pour un
//     item avec libellé sous l'icône) décalait le contenu vers le bas
//     dans ce contexte icône-seule.
// ============================================================

interface MenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "left" | "right"
  showChevron?: boolean
}
export function Menu({ trigger, children, align = "left", showChevron = true }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="relative inline-block text-left">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer inline-flex items-center"
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
        {showChevron && (
          <ChevronDown className="ml-2 -mr-1 h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
        )}
      </div>
      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-2 w-56 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black dark:ring-gray-700 ring-opacity-9 focus:outline-none z-50`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          <div className="py-1" role="none">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

interface MenuItemProps {
  children?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  icon?: React.ReactNode
  isActive?: boolean
  /** Info-bulle native au survol -- n'affecte ni la mise en page ni l'animation. */
  title?: string
}
export function MenuItem({ children, onClick, disabled = false, icon, isActive = false, title }: MenuItemProps) {
  return (
    <button
      className={`relative block w-full h-full text-center group
        ${disabled ? "text-white/40 cursor-not-allowed" : "text-white"}
        ${isActive ? "bg-white/15" : ""}
      `}
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      <span className="flex items-center justify-center h-full w-full">
        {icon && (
          <span className="h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center transition-all duration-200 group-hover:[&_svg]:stroke-[2.5]">
            {icon}
          </span>
        )}
        {children}
      </span>
    </button>
  )
}

interface MenuContainerProps {
  children: React.ReactNode
  /** Contrôlé par QuickActionsFab.tsx ; si omis, comportement interne inchangé (état local). */
  isExpanded?: boolean
  onToggle?: () => void
}
export function MenuContainer({ children, isExpanded: controlledExpanded, onToggle }: MenuContainerProps) {
  const [internalExpanded, setInternalExpanded] = useState(false)
  const isExpanded = controlledExpanded ?? internalExpanded
  const childrenArray = React.Children.toArray(children)
  const totalItems = childrenArray.length
  const isMobile = useIsMobile()
  // Pas d'empilement proportionnel à la taille du bouton (même ratio
  // 48/64 = 0.75 qu'en desktop) pour que le chevauchement des cercles à
  // l'ouverture reste identique visuellement aux deux formats.
  const stackGap = isMobile ? 36 : 48
  const handleToggle = () => {
    if (onToggle) {
      onToggle()
    } else if (internalExpanded) {
      setInternalExpanded(false)
    } else {
      setInternalExpanded(true)
    }
  }
  return (
    <div className="relative w-12 sm:w-16" data-expanded={isExpanded}>
      {/* Container for all items */}
      <div className="relative">
        {/* First item - always visible */}
        <div
          className={`relative w-12 h-12 sm:w-16 sm:h-16 cursor-pointer rounded-full group will-change-transform z-50 ${GLASS_SURFACE}`}
          onClick={handleToggle}
        >
          {childrenArray[0]}
        </div>
        {/* Other items */}
        {childrenArray.slice(1).map((child, index) => (
          <div
            key={index}
            className={`absolute top-0 left-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full will-change-transform ${GLASS_SURFACE}`}
            style={{
              // Ouverture vers le HAUT (bouton ancré en bas de l'écran) --
              // seul changement par rapport au composant fourni, qui
              // ouvrait vers le bas (translateY positif).
              transform: `translateY(${isExpanded ? -(index + 1) * stackGap : 0}px)`,
              opacity: isExpanded ? 1 : 0,
              zIndex: 40 - index,
              clipPath: index === childrenArray.length - 2 
                ? "circle(50% at 50% 50%)" 
                : "circle(50% at 50% 55%)",
              transition: `transform ${isExpanded ? '300ms' : '300ms'} cubic-bezier(0.4, 0, 0.2, 1),
                         opacity ${isExpanded ? '300ms' : '350ms'}`,
              backfaceVisibility: 'hidden',
              perspective: 1000,
              WebkitFontSmoothing: 'antialiased'
            }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}
