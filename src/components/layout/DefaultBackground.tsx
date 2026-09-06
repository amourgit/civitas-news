import React from 'react';
import { AnimatedGradient } from '../ui/AnimatedGradient';
import { useUiStore } from '../../store/ui.store';

/**
 * Arrière-plan PAR DÉFAUT de toutes les pages qui n'appellent pas
 * usePageBackground (voir context/PageBackgroundContext.tsx) : dégradé
 * animé WebGL (voir components/ui/AnimatedGradient.tsx), plein écran.
 *
 * Suit le thème clair/sombre (useUiStore) en basculant entre les
 * préréglages "Civitas" (base sombre) et "CivitasLight" (base claire) --
 * seule la base (noir <-> blanc) change, le violet de marque #5B4DFF
 * (color3) reste rigoureusement identique dans les deux.
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
    <AnimatedGradient
      config={{ preset: theme === 'dark' ? 'Civitas' : 'CivitasLight' }}
      noise={{ opacity: 0.05 }}
    />
  );
};
