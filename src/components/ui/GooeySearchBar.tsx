// ============================================================
// src/components/ui/GooeySearchBar.tsx
// Barre de recherche générique et dynamique à effet "gooey" (le
// bouton pilule se métamorphose en champ de saisie, la bulle
// icône/spinner se détache par fusion visqueuse — filtre SVG
// feGaussianBlur + feColorMatrix, technique dite "gooey effect").
//
// Composant fourni par l'utilisateur sans feuille de style ni source
// de données -- comme les autres composants "fournis" du projet (voir
// AnimatedTabBar.css, ReelsDirectsLoop.css, OrganisationCard.css) :
// ce fichier en reproduit le MÉCANISME (filtre goo, morphing bouton->
// champ, bulle icône qui se sépare) recalibré à l'échelle d'un
// topbar réel, thémé aux couleurs de marque Civitas (violet), et
// GÉNÉRALISÉ pour être 100% réutilisable :
//   - Contrôlé comme SearchBar (`value`/`onChange`) : le texte tapé
//     part immédiatement vers l'appelant (recherche backend, etc.).
//   - AUCUNE donnée n'est figée ici : `suggestions` est fourni par
//     l'appelant à chaque utilisation (voir NewsListPage : titres de
//     News + tables liées -- catégories/organisations/établissements
//     via useReferentiels(), provinces, formats). Ce composant se
//     contente d'afficher la liste déjà calculée/filtrée qu'on lui
//     donne ; il ne connaît rien du domaine News et peut donc être
//     réutilisé tel quel pour n'importe quel autre écran (Sondages,
//     Administration...) en lui passant un autre jeu de suggestions.
//
// Bug corrigé par rapport au composant fourni : le snippet d'origine
// n'exposait aucun moyen de revenir de l'état "champ ouvert" à l'état
// "bouton" (ni clic extérieur, ni bouton de fermeture) -- ajouté ici
// (clic extérieur / Échap / bouton croix) car indispensable dans un
// vrai topbar où plusieurs contrôles cohabitent.
// ============================================================

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import './GooeySearchBar.css';

export interface GooeySearchSuggestion {
  id: string;
  label: string;
  /** Ex: "Thème", "Organisation", "Province", "News"... — libre, fourni par l'appelant. */
  sublabel?: string;
}

export interface GooeySearchBarProps {
  value: string;
  onChange: (value: string) => void;
  /** Suggestions déjà calculées/filtrées par l'appelant pour la `value` courante. */
  suggestions?: GooeySearchSuggestion[];
  isLoading?: boolean;
  /** Texte du bouton au repos — un seul mot court, comme dans le composant fourni ("Search"), pour ne jamais dépasser du champ. */
  collapsedLabel?: string;
  /** Placeholder du champ une fois déployé (peut être plus long/descriptif). */
  placeholder?: string;
  onSelectSuggestion?: (item: GooeySearchSuggestion) => void;
  autoFocus?: boolean;
  className?: string;
}

const buttonVariants: Variants = {
  collapsed: { width: 112 },
  expanded: { width: 248 },
};

const bubbleVariants: Variants = {
  hidden: { x: -30, opacity: 0, scale: 0.6 },
  visible: { x: 0, opacity: 1, scale: 1 },
};

const listVariants: Variants = {
  initial: { opacity: 0, y: -6, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.12 } },
};

const isUnsupportedBrowser = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  const isSafari =
    ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium') && !ua.includes('android') && !ua.includes('firefox');
  return isSafari || ua.includes('crios');
};

export const GooeySearchBar: React.FC<GooeySearchBarProps> = ({
  value,
  onChange,
  suggestions = [],
  isLoading = false,
  collapsedLabel = 'Search',
  placeholder = 'Rechercher…',
  onSelectSuggestion,
  autoFocus = false,
  className = '',
}) => {
  const [step, setStep] = useState<1 | 2>(value ? 2 : 1);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reactId = useId();
  const filterId = `civ-goo-${reactId.replace(/[:]/g, '')}`;
  const isUnsupported = useMemo(() => isUnsupportedBrowser(), []);

  const expand = () => {
    setStep(2);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const collapse = () => {
    setStep(1);
    setIsFocused(false);
  };

  useEffect(() => {
    if (step !== 2) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        if (!value) collapse();
        else setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, value]);

  const handleClear = () => {
    if (value) {
      onChange('');
      inputRef.current?.focus();
    } else {
      collapse();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      handleClear();
    }
  };

  const showDropdown = step === 2 && isFocused && (isLoading || suggestions.length > 0);

  return (
    <div ref={wrapperRef} className={cn('gooey-search-bar', isUnsupported && 'no-goo', className)}>
      <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -15" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="gooey-goo-layer" style={isUnsupported ? undefined : { filter: `url(#${filterId})` }}>
        <motion.button
          type="button"
          variants={buttonVariants}
          animate={step === 1 ? 'collapsed' : 'expanded'}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          onClick={step === 1 ? expand : undefined}
          className="search-btn"
          aria-label={collapsedLabel}
        >
          {step === 1 ? (
            <span className="search-text">
              <Search className="w-3.5 h-3.5 shrink-0" />
              {collapsedLabel}
            </span>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={value}
              autoFocus={autoFocus}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              aria-label={placeholder}
              className="search-input"
            />
          )}
        </motion.button>

        <AnimatePresence mode="popLayout">
          {step === 2 && (
            <motion.button
              key="bubble"
              type="button"
              variants={bubbleVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onClick={handleClear}
              className="search-bubble"
              aria-label={value ? 'Effacer' : 'Fermer la recherche'}
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            variants={listVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.18 }}
            className="search-results"
            role="listbox"
            aria-label="Suggestions"
          >
            {isLoading && suggestions.length === 0 ? (
              <div className="search-result search-result--empty">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Recherche…
              </div>
            ) : (
              suggestions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  className="search-result"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (onSelectSuggestion) onSelectSuggestion(item);
                    else onChange(item.label);
                    setIsFocused(false);
                  }}
                >
                  <span className="search-result-label">{item.label}</span>
                  {item.sublabel && <span className="search-result-sublabel">{item.sublabel}</span>}
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
