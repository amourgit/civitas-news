import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// ============================================================
// src/components/layout/fab/MenuPrimitives.tsx
// Port du composant fourni tel quel -- design et animations
// inchangés. Deux changements strictement délimités :
//  1. Retrait de "use client" (directive Next.js, sans effet et sans
//     équivalent dans cette stack Vite).
//  2. MenuContainer.isExpanded/onToggle sont désormais optionnellement
//     CONTRÔLABLES depuis l'extérieur (sinon comportement interne
//     inchangé) -- nécessaire pour que QuickActionsFab.tsx puisse
//     refermer le menu au début d'un drag et piloter l'ouverture
//     depuis le wrapper de positionnement, sans toucher au rendu ni à
//     l'animation ci-dessous.
// Le sens d'ouverture (vers le HAUT et non vers le bas, puisque le
// bouton est ancré en bas de l'écran -- voir QuickActionsFab.tsx) est
// le seul changement visuel demandé : translateY passe en négatif,
// tout le reste (durées, easing, clipPath, opacity, zIndex...) reste à
// l'identique.
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
      className={`relative block w-full h-16 text-center group
        ${disabled ? "text-gray-400 dark:text-gray-500 cursor-not-allowed" : "text-gray-600 dark:text-gray-300"}
        ${isActive ? "bg-white/10" : ""}
      `}
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      <span className="flex items-center justify-center h-full mt-[5%]">
        {icon && (
          <span className="h-6 w-6 transition-all duration-200 group-hover:[&_svg]:stroke-[2.5]">
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
    <div className="relative w-[64px]" data-expanded={isExpanded}>
      {/* Container for all items */}
      <div className="relative">
        {/* First item - always visible */}
        <div 
          className="relative w-16 h-16 bg-gray-100 dark:bg-gray-800 cursor-pointer rounded-full group will-change-transform z-50"
          onClick={handleToggle}
        >
          {childrenArray[0]}
        </div>
        {/* Other items */}
        {childrenArray.slice(1).map((child, index) => (
          <div 
            key={index} 
            className="absolute top-0 left-0 w-16 h-16 bg-gray-100 dark:bg-gray-800 will-change-transform"
            style={{
              // Ouverture vers le HAUT (bouton ancré en bas de l'écran) --
              // seul changement par rapport au composant fourni, qui
              // ouvrait vers le bas (translateY positif).
              transform: `translateY(${isExpanded ? -(index + 1) * 48 : 0}px)`,
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
