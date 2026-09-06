import React from 'react';
import { AnimatedGradient } from '../ui/AnimatedGradient';

/**
 * Arrière-plan PAR DÉFAUT de toutes les pages qui n'appellent pas
 * usePageBackground (voir context/PageBackgroundContext.tsx) : dégradé
 * animé WebGL (voir components/ui/AnimatedGradient.tsx), préréglage
 * "Civitas" (violet de marque #5B4DFF), plein écran -- remplace
 * l'ancien filigrane logo statique.
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
export const DefaultBackground: React.FC = () => (
  <AnimatedGradient config={{ preset: 'Civitas' }} noise={{ opacity: 0.05 }} />
);
