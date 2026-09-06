import React from 'react';
import { AnimatedGradient } from '../ui/AnimatedGradient';
import { useUiStore } from '../../store/ui.store';

/**
 * Arrière-plan PAR DÉFAUT de toutes les pages qui n'appellent pas
 * usePageBackground (voir context/PageBackgroundContext.tsx) : dégradé
 * animé WebGL (voir components/ui/AnimatedGradient.tsx), plein écran,
 * flouté et voilé façon glassmorphism (sans bordure) pour que le texte
 * des pages reste lisible par-dessus.
 *
 * Suit le thème clair/sombre (useUiStore) en basculant entre les
 * préréglages "Civitas" (base sombre) et "CivitasLight" (base claire) --
 * seule la base (noir <-> blanc) change, le violet de marque #5B4DFF
 * (color3) reste rigoureusement identique dans les deux. Le voile
 * ci-dessous suit le même thème (blanc translucide en clair, noir
 * translucide en sombre).
 *
 * Bascule automatiquement sur un dégradé CSS statique équivalent si
 * WebGL2 n'est pas disponible sur l'appareil (voir WebGLFallback dans
 * AnimatedGradient.tsx) -- jamais bloquant.
 *
 * C'est le point à éditer pour changer le décor par défaut commun à
 * toutes les pages — les pages qui définissent déjà le leur via
 * usePageBackground ne sont pas concernées, elles l'écrasent entièrement
 * (voir PageBackgroundLayer.tsx : `background ?? <DefaultBackground />`).
 */
export const DefaultBackground: React.FC = () => {
  const { theme } = useUiStore();
  return (
    <>
      {/* scale-125 compense le bord transparent que le flou créerait
          sinon sur les contours de l'écran (PageBackgroundLayer.tsx
          recadre proprement à la taille du viewport, voir son propre
          overflow-hidden). */}
      <AnimatedGradient
        config={{ preset: theme === 'dark' ? 'Civitas' : 'CivitasLight' }}
        noise={{ opacity: 0.05 }}
        className="scale-105 blur-[6px]"
      />
      {/* Voile translucide par-dessus, sans bordure : adoucit encore le
          contraste du dégradé pour que le texte reste lisible quelle
          que soit la page. */}
      <div className="absolute inset-0 bg-white/35 dark:bg-black/30" />
    </>
  );
};
