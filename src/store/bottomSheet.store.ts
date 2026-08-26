import { useState, useEffect, type ReactNode } from 'react';

/**
 * Pilote UNE instance globale de BottomSheet (montée une seule fois,
 * voir components/ui/GlobalBottomSheet.tsx dans App.tsx), dont le
 * contenu est fourni à la volée par n'importe quel composant --
 * initialement NewsCard pour les détails d'une News/Sujet, mais pensé
 * pour être réutilisé par d'autres cards/composants plus tard. Même
 * pattern observable que ui.store.ts (pas de dépendance à une lib de
 * state management).
 */
interface BottomSheetState {
  isOpen: boolean;
  content: ReactNode | null;
}

let state: BottomSheetState = { isOpen: false, content: null };

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

  const openSheet = (content: ReactNode) => {
    state = { isOpen: true, content };
    notify();
  };

  const closeSheet = () => {
    // Le contenu n'est PAS effacé ici : il reste affiché pendant
    // l'animation de fermeture du BottomSheet (voir AnimatePresence
    // dans BottomSheet.tsx), qui continue de rendre le dernier arbre
    // reçu le temps de glisser vers le bas. Il sera simplement
    // remplacé au prochain openSheet().
    state = { ...state, isOpen: false };
    notify();
  };

  return {
    ...sheet,
    openSheet,
    closeSheet,
  };
}
