import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Depuis le passage à la topbar NotchNav (voir Header.tsx), la page
    // elle-même ne défile plus : tout le contenu défile DANS le panneau
    // interne de NotchNav (#notch-nav-scroll-viewport, voir notch-nav.tsx).
    // window.scrollTo seul n'a donc plus aucun effet ; on garde l'appel
    // par sécurité (défilement natif si jamais on revient à un layout
    // classique) et on cible en plus explicitement ce conteneur.
    const viewport = document.getElementById('notch-nav-scroll-viewport');
    viewport?.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return null;
};
