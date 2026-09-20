// ============================================================
// src/components/ui/DragCarousel.tsx
// Carrousel horizontal "libre" générique : piste glissée à la souris
// ou au doigt, avec une vraie inertie (pas de pas figés type snap).
// Volontairement sans flèches ni points de pagination -- l'affordance
// tient à trois détails discrets à la place :
//  - le curseur (grab / grabbing) ;
//  - un unique et bref aller-retour au tout premier affichage,
//    jamais répété, jamais si l'utilisateur préfère un mouvement
//    réduit ;
//  - un mince repère de progression sous la piste, seule indication
//    de position (pas de flèches/points, voir UserOrbitCarousel.tsx
//    pour ce pattern plus classique déjà utilisé ailleurs dans l'app).
// Un fondu latéral, posé sur les bords de la piste, n'apparaît que
// s'il reste effectivement du contenu à découvrir dans cette
// direction (jamais un simple décor statique).
// Petit plus tactile : la piste "penche" très légèrement (skew) dans
// le sens du geste pendant un flick, et revient à plat par ressort --
// un effet purement dérivé de la vélocité du glissement, sans étape
// d'animation manuelle.
//
// Les enfants (une carte par élément, chacune responsable de sa
// propre largeur via `shrink-0`) ne sont pas modifiés : ce composant
// se contente de les envelopper dans la piste glissable. Réutilisable
// pour toute rangée de cartes qui doit se comporter comme un rail
// libre plutôt qu'une grille ou un scroll natif classique.
// ============================================================
import React, { useLayoutEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform, type PanInfo } from 'motion/react';
import { clamp } from '../../lib/utils';

const RAIL_WIDTH = 56;
const RAIL_MIN_THUMB = 16;
const DRAG_CLICK_THRESHOLD = 6;
const NUDGE_DELAY_MS = 500;

export interface DragCarouselProps {
  children: React.ReactNode;
  /** Classes pour le conteneur racine (position relative). */
  className?: string;
  /** Classes pour le conteneur qui rogne le débordement horizontal --
   * typiquement une marge négative + un léger padding pour laisser la
   * zone de glissement respirer jusqu'aux bords (ex: `-mx-1 px-1`). */
  viewportClassName?: string;
  /** Classes pour la piste elle-même (gap, alignement, padding
   * vertical -- ex: pour laisser la place à un glow qui déborde). */
  trackClassName?: string;
  ariaLabel?: string;
  /** Couleur vers laquelle les fondus latéraux se dégradent -- doit
   * correspondre au fond réel affiché derrière le carrousel. */
  fadeColor?: string;
}

export const DragCarousel: React.FC<DragCarouselProps> = ({
  children,
  className = '',
  viewportClassName = '',
  trackClassName = '',
  ariaLabel,
  fadeColor = 'var(--civitas-bg-base)',
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const wasDraggingRef = useRef(false);
  const hasNudgedRef = useRef(false);

  const [maxDrag, setMaxDrag] = useState(0);
  const [thumbWidth, setThumbWidth] = useState(RAIL_WIDTH);
  const canDrag = maxDrag > 0;

  const x = useMotionValue(0);
  const rawVelocity = useMotionValue(0);
  const smoothedVelocity = useSpring(rawVelocity, { stiffness: 200, damping: 24, mass: 0.5 });
  const skewX = useTransform(smoothedVelocity, [-1400, 0, 1400], [6, 0, -6]);
  const prefersReducedMotion = useReducedMotion();

  const leftFadeOpacity = useTransform(x, (latest) => clamp(-latest / 10, 0, 1));
  const rightFadeOpacity = useTransform(x, (latest) => clamp((maxDrag + latest) / 10, 0, 1));
  const thumbX = useTransform(x, (latest) => {
    if (maxDrag <= 0) return 0;
    return clamp(-latest / maxDrag, 0, 1) * (RAIL_WIDTH - thumbWidth);
  });

  const childCount = React.Children.count(children);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const measure = () => {
      const vw = viewport.offsetWidth;
      const tw = track.scrollWidth;
      const nextMaxDrag = Math.max(0, tw - vw);
      setMaxDrag(nextMaxDrag);
      setThumbWidth(tw > 0 ? Math.max(RAIL_MIN_THUMB, (vw / tw) * RAIL_WIDTH) : RAIL_WIDTH);
      // Le contenu peut changer de taille (filtre, suppression...) :
      // on recadre la position courante pour ne jamais rester hors piste.
      x.set(clamp(x.get(), -nextMaxDrag, 0));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    ro.observe(track);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childCount]);

  useLayoutEffect(() => {
    if (hasNudgedRef.current || !canDrag || prefersReducedMotion) return;
    hasNudgedRef.current = true;
    const nudge = Math.min(32, maxDrag);
    const timer = window.setTimeout(() => {
      void animate(x, -nudge, { duration: 0.5, ease: [0.22, 1, 0.36, 1] }).then(() => {
        animate(x, 0, { duration: 0.6, ease: [0.22, 1, 0.36, 1] });
      });
    }, NUDGE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [canDrag, maxDrag, prefersReducedMotion, x]);

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    rawVelocity.set(info.velocity.x);
    if (!wasDraggingRef.current && Math.abs(info.offset.x) > DRAG_CLICK_THRESHOLD) {
      wasDraggingRef.current = true;
    }
  };

  const handleDragEnd = () => {
    rawVelocity.set(0);
    // Laisse le temps à l'événement "click" natif -- déclenché juste
    // après le pointerup, dans la même tâche -- de voir encore `true`
    // avant qu'on le relâche : un simple clic sans mouvement ne passe
    // jamais par ici (voir le seuil dans handleDrag).
    requestAnimationFrame(() => {
      wasDraggingRef.current = false;
    });
  };

  const handleClickCapture = (event: React.MouseEvent) => {
    if (wasDraggingRef.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!canDrag) return;
    const step = Math.max(240, (viewportRef.current?.offsetWidth ?? 320) * 0.8);
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      animate(x, clamp(x.get() - step, -maxDrag, 0), { type: 'spring', stiffness: 320, damping: 32 });
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      animate(x, clamp(x.get() + step, -maxDrag, 0), { type: 'spring', stiffness: 320, damping: 32 });
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={viewportRef}
        className={`relative overflow-x-hidden overflow-y-visible ${viewportClassName}`}
      >
        <motion.div
          ref={trackRef}
          role="group"
          aria-label={ariaLabel}
          tabIndex={canDrag ? 0 : -1}
          drag={canDrag ? 'x' : false}
          dragConstraints={viewportRef}
          dragElastic={0.1}
          dragTransition={{ power: 0.32, timeConstant: 260, bounceStiffness: 280, bounceDamping: 26 }}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          onClickCapture={handleClickCapture}
          onKeyDown={handleKeyDown}
          style={{ x, skewX, touchAction: 'pan-y' }}
          className={`flex select-none outline-none ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''} ${trackClassName}`}
        >
          {children}
        </motion.div>

        {canDrag && (
          <>
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-14"
              style={{ opacity: leftFadeOpacity, background: `linear-gradient(to right, ${fadeColor}, transparent)` }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-14"
              style={{ opacity: rightFadeOpacity, background: `linear-gradient(to left, ${fadeColor}, transparent)` }}
            />
          </>
        )}
      </div>

      {canDrag && (
        <div
          className="mx-auto mt-2.5 overflow-hidden rounded-full bg-gray-200/70 dark:bg-white/10"
          style={{ width: RAIL_WIDTH, height: 3 }}
        >
          <motion.div
            className="h-full rounded-full bg-[#5B4DFF]"
            style={{ width: thumbWidth, x: thumbX }}
          />
        </div>
      )}
    </div>
  );
};
