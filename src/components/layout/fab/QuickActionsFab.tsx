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
/** Même seuil que MOBILE_BREAKPOINT dans MenuPrimitives.tsx -- doit rester synchronisé. */
const MOBILE_BREAKPOINT = 640;
/** w-16/h-16 (desktop) ou w-12/h-12 (mobile) du bouton -- voir MenuPrimitives.tsx. */
const BUTTON_SIZE_DESKTOP = 64;
const BUTTON_SIZE_MOBILE = 48;
/** Recalculée à chaque appel (montage, resize, fin de drag) : le footprint réel du bouton dépend du viewport courant. */
function getButtonSize(): number {
  return window.innerWidth < MOBILE_BREAKPOINT ? BUTTON_SIZE_MOBILE : BUTTON_SIZE_DESKTOP;
}
/** Position verticale par défaut : au-dessus du dock mobile (h-16 + zone tactile + safe-area, voir MobileDock.tsx). */
const DEFAULT_BOTTOM_OFFSET = 96;
/** Distance (px) avant de considérer le geste comme un drag plutôt qu'un simple clic. */
const DRAG_THRESHOLD = 6;
/** 0-1 : plus petit = suivi plus "en retard"/élastique sur le pointeur pendant le drag. */
const FOLLOW_STIFFNESS = 0.22;
/**
 * Rebond d'ancrage au relâchement -- oscillateur harmonique amorti
 * calculé analytiquement image par image (rAF), PAS une transition CSS
 * figée (celle-ci ne pouvait produire qu'un unique et léger dépassement,
 * ressenti comme un arrêt brusque) :
 *   delta(t) = delta0 * e^(-BOUNCE_DECAY * t) * cos(BOUNCE_ANGULAR_FREQUENCY * t)
 *   position(t) = cible + delta(t)  (position toujours re-clampée à
 *   l'écran, voir runBounceSnap -- un dépassement calculé ne doit
 *   jamais pouvoir sortir le bouton de la zone visible, même pour un
 *   très grand déplacement initial)
 * -- delta0 étant l'écart entre le point de lâcher et le coin cible.
 * Constantes choisies empiriquement pour ~3 rebonds nettement visibles
 * (dépassement ~30% puis ~9% puis ~3%) avant stabilisation complète,
 * sur BOUNCE_DURATION ms.
 */
const BOUNCE_DURATION = 850;
const BOUNCE_DECAY = 0.0085;
const BOUNCE_ANGULAR_FREQUENCY = 0.0225;

interface Position {
  /** Distance depuis le bord gauche de la fenêtre, en px. */
  x: number;
  /** Distance depuis le bord haut de la fenêtre, en px. */
  y: number;
}

function clampPosition(pos: Position): Position {
  const buttonSize = getButtonSize();
  const maxX = Math.max(window.innerWidth - buttonSize - EDGE_MARGIN, EDGE_MARGIN);
  const maxY = Math.max(window.innerHeight - buttonSize - EDGE_MARGIN, EDGE_MARGIN);
  return {
    x: Math.min(Math.max(pos.x, EDGE_MARGIN), maxX),
    y: Math.min(Math.max(pos.y, EDGE_MARGIN), maxY),
  };
}

/** Ancre sur le bord vertical le plus proche (gauche ou droite) ; la position verticale, elle, est conservée telle que lâchée. */
function snapToNearestEdge(pos: Position): Position {
  const viewportWidth = window.innerWidth;
  const buttonSize = getButtonSize();
  const distanceToLeft = pos.x;
  const distanceToRight = viewportWidth - (pos.x + buttonSize);
  const x = distanceToLeft <= distanceToRight ? EDGE_MARGIN : viewportWidth - buttonSize - EDGE_MARGIN;
  return clampPosition({ x, y: pos.y });
}

function defaultPosition(): Position {
  const buttonSize = getButtonSize();
  return clampPosition({
    x: window.innerWidth - buttonSize - EDGE_MARGIN,
    y: window.innerHeight - buttonSize - DEFAULT_BOTTOM_OFFSET,
  });
}

/**
 * Drag : suivi élastique -- la position visuelle rattrape la position
 * du pointeur avec un temps de retard (FOLLOW_STIFFNESS) via une
 * boucle requestAnimationFrame qui écrit directement le style DOM
 * (pas de re-render React à chaque frame, uniquement des refs). Au
 * relâchement, retour ANIMÉ (jamais un saut instantané) vers le bord
 * vertical le plus proche, avec rebond (voir runBounceSnap /
 * BOUNCE_* ci-dessus) : le bouton dépasse la cible, revient en arrière,
 * dépasse encore un peu moins, etc. -- environ 3 rebonds visibles avant
 * de se stabiliser complètement. Position persistée en localStorage
 * pour être restaurée d'une visite à l'autre. Un simple clic (mouvement
 * sous DRAG_THRESHOLD) n'est jamais intercepté : il atteint normalement
 * le onClick interne de MenuContainer.
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
  const bounceRafRef = useRef<number | null>(null);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; originX: number; originY: number } | null>(null);
  const wasDraggedRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const applyStyle = useCallback((pos: Position) => {
    const el = wrapperRef.current;
    if (!el) return;
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
    applyStyle(initial);
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
      applyStyle(reclamped);
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

  const stopBounceAnimation = useCallback(() => {
    if (bounceRafRef.current !== null) {
      cancelAnimationFrame(bounceRafRef.current);
      bounceRafRef.current = null;
    }
  }, []);

  /**
   * Anime le retour au bord après un lâcher, avec rebond. Trajectoire
   * calculée directement à partir du temps écoulé (pas de simulation
   * pas-à-pas à état cumulatif) : reproductible, et interrompue
   * proprement si l'utilisateur ressaisit le bouton en plein rebond
   * (voir handlePointerDown) ou si le composant est démonté.
   */
  const runBounceSnap = useCallback((from: Position, to: Position) => {
    stopBounceAnimation();
    const startTime = performance.now();
    const delta0X = from.x - to.x;
    const delta0Y = from.y - to.y;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed >= BOUNCE_DURATION) {
        visualPositionRef.current = to;
        applyStyle(to);
        bounceRafRef.current = null;
        return;
      }
      const envelope = Math.exp(-BOUNCE_DECAY * elapsed) * Math.cos(BOUNCE_ANGULAR_FREQUENCY * elapsed);
      const next: Position = clampPosition({
        x: to.x + delta0X * envelope,
        y: to.y + delta0Y * envelope,
      });
      visualPositionRef.current = next;
      applyStyle(next);
      bounceRafRef.current = requestAnimationFrame(tick);
    };
    bounceRafRef.current = requestAnimationFrame(tick);
  }, [applyStyle, stopBounceAnimation]);

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
      applyStyle(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [applyStyle]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 || !positionRef.current) return; // clic gauche/tactile uniquement
    stopBounceAnimation(); // ressaisi en plein rebond : on coupe net l'animation en cours
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      originX: positionRef.current.x,
      originY: positionRef.current.y,
    };
    wasDraggedRef.current = false;
  }, [stopBounceAnimation]);

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

    const from = visualPositionRef.current;
    const snapped = snapToNearestEdge(positionRef.current);
    positionRef.current = snapped;
    runBounceSnap(from, snapped);
    setSavedPosition(snapped);
  }, [stopFollowLoop, runBounceSnap, setSavedPosition]);

  // Coupe les boucles de suivi/rebond si le composant est démonté en
  // plein geste (navigation programmatique, etc.).
  useLayoutEffect(() => () => {
    stopFollowLoop();
    stopBounceAnimation();
  }, [stopFollowLoop, stopBounceAnimation]);

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

        <Can permission={PERMISSIONS.ADMIN_QUICK_NEWS_CREATE}>
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
