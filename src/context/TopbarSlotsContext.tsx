import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Même contrat que SideContentContext.tsx, appliqué à la topbar : la
// topbar est montée UNE SEULE FOIS au niveau de App.tsx (voir Header.tsx),
// donc une page ne peut pas y insérer du JSX directement dans son propre
// arbre. Ce contexte sert de "boîte aux lettres" entre la page active et
// NotchNav (voir ui/notch-nav.tsx) : n'importe quelle page appelle
// useSetTopbarContent('upper' | 'lower', <mon JSX/>) pour publier son
// contenu, et Header.tsx le relit pour l'injecter au bon endroit — quel
// que soit le niveau (supérieur = notches historiques, inférieur =
// nouvelle couche, voir notch-nav.tsx). Deux niveaux, deux emplacements
// de state indépendants, mais une seule API symétrique pour les deux.

export type TopbarLevel = 'upper' | 'lower';

interface TopbarSlotsContextType {
  upperContent: ReactNode | null;
  lowerContent: ReactNode | null;
  setSlotContent: (level: TopbarLevel, content: ReactNode | null) => void;
  resetSlotContent: (level: TopbarLevel) => void;
}

const noop = () => {};

const TopbarSlotsContext = createContext<TopbarSlotsContextType>({
  upperContent: null,
  lowerContent: null,
  setSlotContent: noop,
  resetSlotContent: noop,
});

export const TopbarSlotsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [upperContent, setUpperContent] = useState<ReactNode | null>(null);
  const [lowerContent, setLowerContent] = useState<ReactNode | null>(null);

  const setSlotContent = (level: TopbarLevel, content: ReactNode | null) => {
    (level === 'upper' ? setUpperContent : setLowerContent)(content);
  };

  const resetSlotContent = (level: TopbarLevel) => {
    (level === 'upper' ? setUpperContent : setLowerContent)(null);
  };

  return (
    <TopbarSlotsContext.Provider value={{ upperContent, lowerContent, setSlotContent, resetSlotContent }}>
      {children}
    </TopbarSlotsContext.Provider>
  );
};

export const useTopbarSlots = () => useContext(TopbarSlotsContext);

/**
 * Permet à une page d'injecter son propre contenu dans le niveau
 * supérieur OU inférieur de la topbar dès son montage, et de le
 * réinitialiser automatiquement au démontage (même contrat que
 * useSetSideContent, voir SideContentContext.tsx). `deps` doit inclure
 * tout état réactif référencé par `content` (valeurs de champs,
 * booléens d'ouverture...) pour que la topbar reflète l'état le plus
 * récent de la page à chaque re-render pertinent.
 */
export function useSetTopbarContent(level: TopbarLevel, content: ReactNode | null, deps: any[] = []) {
  const { setSlotContent, resetSlotContent } = useTopbarSlots();

  useEffect(() => {
    setSlotContent(level, content);
    return () => resetSlotContent(level);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, ...deps]);
}
