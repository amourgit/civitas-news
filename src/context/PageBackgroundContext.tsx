import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PageBackgroundContextType {
  background: ReactNode | null;
  setBackground: (content: ReactNode | null) => void;
  resetBackground: () => void;
}

const PageBackgroundContext = createContext<PageBackgroundContextType>({
  background: null,
  setBackground: () => {},
  resetBackground: () => {},
});

/**
 * À monter UNE SEULE FOIS, tout en haut de l'app (voir App.tsx). Ne rend
 * rien de visuel par lui-même — c'est PageBackgroundLayer (dans
 * components/layout/) qui affiche réellement `background`, ou
 * DefaultBackground quand il vaut null.
 */
export const PageBackgroundProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [background, setBackgroundState] = useState<ReactNode | null>(null);

  const setBackground = (content: ReactNode | null) => {
    setBackgroundState(content);
  };

  const resetBackground = () => {
    setBackgroundState(null);
  };

  return (
    <PageBackgroundContext.Provider value={{ background, setBackground, resetBackground }}>
      {children}
    </PageBackgroundContext.Provider>
  );
};

export const usePageBackgroundContext = () => useContext(PageBackgroundContext);

/**
 * Permet à une page de remplacer explicitement l'arrière-plan par défaut
 * de tout le site (voir components/layout/DefaultBackground.tsx) par son
 * propre composant React — image, dégradé, canvas, ou vidéo en boucle
 * sans contrôles : n'importe quel contenu, puisqu'il est reçu tel quel en
 * children (donc en props) et rendu sans modification.
 *
 * Revient automatiquement au fond par défaut au démontage de la page
 * (changement de route). Même contrat que useSetSideContent (voir
 * SideContentContext.tsx) : à appeler une fois dans le composant de page,
 * avec les mêmes deps que ferait un useEffect.
 *
 * @example
 *   usePageBackground(
 *     <video autoPlay loop muted playsInline className="h-full w-full object-cover"
 *            src="/videos/hero-loop.mp4" />
 *   );
 */
export function usePageBackground(content: ReactNode, deps: unknown[] = []) {
  const { setBackground, resetBackground } = usePageBackgroundContext();

  useEffect(() => {
    setBackground(content);
    return () => {
      resetBackground();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
