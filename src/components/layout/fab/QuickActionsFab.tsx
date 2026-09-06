import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, X, Settings, Moon, Sun, PenSquare } from 'lucide-react';
import { MenuContainer, MenuItem } from './MenuPrimitives';
import { useUiStore } from '../../../store/ui.store';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { Can } from '../../../lib/permissions/Can';
import { PERMISSIONS } from '../../../lib/permissions/permissions.catalog';

// ============================================================
// src/components/layout/fab/QuickActionsFab.tsx
// Bouton flottant global (actions rapides + réglages), monté une seule
// fois à la racine (voir App.tsx) donc présent sur toutes les pages.
// NE TOUCHE PAS au rendu ni à l'animation d'expansion de MenuContainer
// (voir MenuPrimitives.tsx) : ce fichier se contente de le positionner
// en `fixed` et d'ajouter le drag par-dessus, via un wrapper englobant.
// ============================================================

const STORAGE_KEY = 'civitas_quick_actions_fab_position';
/** Distance gardée par rapport au bord de l'écran une fois ancré. */
const EDGE_MARGIN = 16;
/** w-16/h-16 du bouton -- voir MenuPrimitives.tsx (design inchangé). */
const BUTTON_SIZE = 64;
/** Position verticale par défaut : au-dessus du dock mobile (h-16 + zone tactile + safe-area, voir MobileDock.tsx). */
const DEFAULT_BOTTOM_OFFSET = 96;
/** Distance (px) avant de considérer le geste comme un drag plutôt qu'un simple clic. */
const DRAG_THRESHOLD = 6;
/** 0-1 : plus petit = suivi plus "en retard"/élastique sur le pointeur pendant le drag. */
const FOLLOW_STIFFNESS = 0.22;
/** Easing avec léger dépassement -- donne la sensation élastique à l'ancrage sur le bord. */
const SNAP_TRANSITION = 'left 320ms cubic-bezier(0.34, 1.56, 0.64, 1), top 320ms cubic-bezier(0.34, 1.56, 0.64, 1)';

interface Position {
  /** Distance depuis le bord gauche de la fenêtre, en px. */
  x: number;
  /** Distance depuis le bord haut de la fenêtre, en px. */
  y: number;
}

function clampPosition(pos: Position): Position {
  const maxX = Math.max(window.innerWidth - BUTTON_SIZE - EDGE_MARGIN, EDGE_MARGIN);
  const maxY = Math.max(window.innerHeight - BUTTON_SIZE - EDGE_MARGIN, EDGE_MARGIN);
  return {
    x: Math.min(Math.max(pos.x, EDGE_MARGIN), maxX),
    y: Math.min(Math.max(pos.y, EDGE_MARGIN), maxY),
  };
}

/** Ancre sur le bord vertical le plus proche (gauche ou droite) ; la position verticale, elle, est conservée telle que lâchée. */
function snapToNearestEdge(pos: Position): Position {
  const viewportWidth = window.innerWidth;
  const distanceToLeft = pos.x;
  const distanceToRight = viewportWidth - (pos.x + BUTTON_SIZE);
  const x = distanceToLeft <= distanceToRight ? EDGE_MARGIN : viewportWidth - BUTTON_SIZE - EDGE_MARGIN;
  return clampPosition({ x, y: pos.y });
}

function defaultPosition(): Position {
  return clampPosition({
    x: window.innerWidth - BUTTON_SIZE - EDGE_MARGIN,
    y: window.innerHeight - BUTTON_SIZE - DEFAULT_BOTTOM_OFFSET,
  });
}

/**
 * Drag : suivi élastique -- la position visuelle rattrape la position
 * du pointeur avec un temps de retard (FOLLOW_STIFFNESS) via une
 * boucle requestAnimationFrame qui écrit directement le style DOM
 * (pas de re-render React à chaque frame, uniquement des refs). Au
 * relâchement, ancrage animé (transition CSS avec léger dépassement)
 * sur le bord vertical le plus proche ; position persistée en
 * localStorage pour être restaurée d'une visite à l'autre. Un simple
 * clic (mouvement sous DRAG_THRESHOLD) n'est jamais intercepté : il
 * atteint normalement le onClick interne de MenuContainer.
 */
export function QuickActionsFab() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useUiStore();
  const [savedPosition, setSavedPosition] = useLocalStorage<Position | null>(STORAGE_KEY, null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<Position | null>(null);
  const visualPositionRef = useRef<Position>({ x: 0, y: 0 });
  const pointerTargetRef = useRef<Position | null>(null);
  const rafRef = useRef<number | null>(null);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; originX: number; originY: number } | null>(null);
  const wasDraggedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const applyStyle = useCallback((pos: Position, withTransition: boolean) => {
    const el = wrapperRef.current;
    if (!el) return;
    el.style.transition = withTransition ? SNAP_TRANSITION : 'none';
    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y}px`;
  }, []);

  // Position initiale avant le premier paint (useLayoutEffect, pas
  // useEffect) : évite de voir le bouton apparaître dans un coin par
  // défaut puis "sauter" vers sa position sauvegardée.
  useLayoutEffect(() => {
    const initial = savedPosition ? clampPosition(savedPosition) : defaultPosition();
    positionRef.current = initial;
    visualPositionRef.current = initial;
    applyStyle(initial, false);
    // Volontairement exécuté une seule fois au montage : savedPosition
    // ne doit resynchroniser l'affichage qu'à la création du composant,
    // pas à chaque écriture localStorage déclenchée par ce composant
    // lui-même en fin de drag (voir handlePointerUp).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redimensionnement (rotation d'écran, resize desktop) : reclamp sans
  // changer de bord.
  useLayoutEffect(() => {
    const handleResize = () => {
      if (!positionRef.current) return;
      const reclamped = clampPosition(positionRef.current);
      positionRef.current = reclamped;
      visualPositionRef.current = reclamped;
      applyStyle(reclamped, false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [applyStyle]);

  const stopFollowLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const runFollowLoop = useCallback(() => {
    const tick = () => {
      const target = pointerTargetRef.current;
      if (!target) return;
      const current = visualPositionRef.current;
      const next: Position = {
        x: current.x + (target.x - current.x) * FOLLOW_STIFFNESS,
        y: current.y + (target.y - current.y) * FOLLOW_STIFFNESS,
      };
      visualPositionRef.current = next;
      applyStyle(next, false);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [applyStyle]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 || !positionRef.current) return; // clic gauche/tactile uniquement
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      originX: positionRef.current.x,
      originY: positionRef.current.y,
    };
    wasDraggedRef.current = false;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const start = dragStartRef.current;
    if (!start) return;
    const deltaX = e.clientX - start.pointerX;
    const deltaY = e.clientY - start.pointerY;

    if (!wasDraggedRef.current) {
      if (Math.abs(deltaX) < DRAG_THRESHOLD && Math.abs(deltaY) < DRAG_THRESHOLD) return;
      wasDraggedRef.current = true;
      setIsDragging(true);
      setIsExpanded(false); // referme le menu s'il était ouvert avant de commencer à glisser
      runFollowLoop();
    }

    const target = clampPosition({ x: start.originX + deltaX, y: start.originY + deltaY });
    pointerTargetRef.current = target;
    positionRef.current = target;
  }, [runFollowLoop]);

  const handlePointerUp = useCallback(() => {
    dragStartRef.current = null;
    if (!wasDraggedRef.current || !positionRef.current) return; // simple clic : laisser MenuContainer gérer l'ouverture

    stopFollowLoop();
    pointerTargetRef.current = null;
    setIsDragging(false);

    const snapped = snapToNearestEdge(positionRef.current);
    positionRef.current = snapped;
    visualPositionRef.current = snapped;
    applyStyle(snapped, true);
    setSavedPosition(snapped);
  }, [applyStyle, stopFollowLoop, setSavedPosition]);

  // Coupe la boucle de suivi si le composant est démonté en plein drag
  // (navigation programmatique, etc.).
  useLayoutEffect(() => stopFollowLoop, [stopFollowLoop]);

  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (wasDraggedRef.current) {
      // Un drag vient de se terminer sur ce relâchement : on empêche le
      // clic de rouvrir/fermer le menu (MenuContainer) ou de déclencher
      // l'action d'un MenuItem sous le pointeur.
      e.stopPropagation();
      wasDraggedRef.current = false;
    }
  }, []);

  const goTo = (path: string) => {
    setIsExpanded(false);
    navigate(path);
  };

  return (
    <div
      ref={wrapperRef}
      className="fixed z-[90] touch-none select-none"
      style={{
        transform: isDragging ? 'scale(1.06)' : undefined,
        transition: isDragging ? 'transform 150ms ease-out' : 'transform 200ms ease-out',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClickCapture={handleClickCapture}
    >
      <MenuContainer isExpanded={isExpanded} onToggle={() => setIsExpanded((v) => !v)}>
        {/* Déclencheur -- icône adaptée à sa fonction (actions rapides), bascule vers une croix quand ouvert. */}
        <MenuItem icon={isExpanded ? <X /> : <Zap />} title={isExpanded ? 'Fermer' : 'Actions rapides'} />

        <Can permission={PERMISSIONS.NEWS_CREATE}>
          <MenuItem icon={<PenSquare />} title="Publier un article" onClick={() => goTo('/news/creer')}>
            <span className="sr-only">Publier un article</span>
          </MenuItem>
        </Can>

        <MenuItem
          icon={theme === 'dark' ? <Sun /> : <Moon />}
          title={theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'}
          onClick={() => {
            toggleTheme();
            setIsExpanded(false);
          }}
        >
          <span className="sr-only">{theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'}</span>
        </MenuItem>

        <MenuItem icon={<Settings />} title="Réglages" onClick={() => goTo('/parametres')}>
          <span className="sr-only">Réglages</span>
        </MenuItem>
      </MenuContainer>
    </div>
  );
}

export default QuickActionsFab;
