import { useState, useEffect, type ReactNode } from 'react';

/**
 * Pilote UNE instance globale de BottomSheet (montée une seule fois,
 * voir components/ui/GlobalBottomSheet.tsx dans App.tsx), dont le
 * contenu est fourni à la volée par n'importe quel composant qui n'a
 * pas déjà son propre état local de sélection (voir NewsListPage.tsx /
 * HomePage.tsx / RecherchePage.tsx, qui gèrent leur BottomSheet
 * elles-mêmes) -- carrousel d'accueil, widgets de stats, liens de
 * retour, redirection post-création... Pensé pour être réutilisé par
 * d'autres composants futurs, pas seulement les News. Même pattern
 * observable que ui.store.ts (pas de dépendance à une lib de state
 * management).
 */
interface BottomSheetState {
  isOpen: boolean;
  content: ReactNode | null;
  title?: string;
}

let state: BottomSheetState = { isOpen: false, content: null, title: undefined };

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function useBottomSheetStore() {
  const [sheet, setSheet] = useState<BottomSheetState>(state);

  useEffect(() => {
    const handleChange = () => setSheet({ ...state });
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const openSheet = (content: ReactNode, title?: string) => {
    state = { isOpen: true, content, title };
    notify();
  };

  const closeSheet = () => {
    // Le contenu n'est PAS effacé ici : il reste affiché pendant
    // l'animation de fermeture du BottomSheet, qui continue de rendre
    // le dernier arbre reçu le temps de glisser vers le bas. Il sera
    // simplement remplacé au prochain openSheet().
    state = { ...state, isOpen: false };
    notify();
  };

  return {
    ...sheet,
    openSheet,
    closeSheet,
  };
}
