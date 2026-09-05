import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Depuis la refonte structurelle de la topbar NotchNav (voir
    // notch-nav.tsx), celle-ci ne rend plus qu'un bandeau `fixed` et
    // ne possède plus de conteneur de scroll interne : la page défile
    // à nouveau normalement (le document/la fenêtre), comme avant
    // l'introduction de #notch-nav-scroll-viewport.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
};
