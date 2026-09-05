import React from 'react';

// Même fichier que le logo de la topbar (voir Header.tsx) — une seule
// source de vérité pour "le logo" de la marque.
const LOGO_SRC = '/images/ChatGPT_Image_10_juin_2026__02_11_18-removebg-preview.png';

/**
 * Arrière-plan PAR DÉFAUT de toutes les pages qui n'appellent pas
 * usePageBackground (voir context/PageBackgroundContext.tsx) : le logo
 * CIVITAS en couverture plein écran (object-cover), en filigrane
 * derrière tout le contenu.
 *
 * - `invert dark:invert-0` : le fichier est un PNG quasi blanc/argenté
 *   (transparent) — illisible tel quel sur le fond clair (#F7F8FC) sans
 *   inversion. `dark:invert-0` annule l'inversion en mode sombre, où le
 *   logo retrouve sa teinte claire d'origine, déjà lisible sur le fond
 *   sombre (#0E1338) — exactement comme dans la topbar.
 * - opacity-[0.07] : intensité réglée en filigrane discret pour rester
 *   un décor et ne jamais concurrencer le contenu réel (cartes, texte...)
 *   qui, lui, reste entièrement opaque au premier plan. Un seul nombre
 *   à ajuster ici si tu veux un rendu plus ou moins marqué.
 *
 * C'est le point à éditer pour changer le décor par défaut commun à
 * toutes les pages — les pages qui définissent déjà le leur via
 * usePageBackground ne sont pas concernées, elles l'écrasent entièrement
 * (voir PageBackgroundLayer.tsx : `background ?? <DefaultBackground />`).
 */
export const DefaultBackground: React.FC = () => (
  <div className="absolute inset-0 bg-[#F7F8FC] dark:bg-[#0E1338] transition-colors duration-300">
    <img
      src={LOGO_SRC}
      alt=""
      aria-hidden="true"
      className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.07] invert dark:invert-0 transition-[filter] duration-300"
    />
  </div>
);
