import React from 'react';
import { BottomSheet } from './BottomSheet';
import { useBottomSheetStore } from '../../store/bottomSheet.store';

/**
 * À monter UNE SEULE FOIS près de la racine de l'app (voir App.tsx,
 * à côté de <LoginModal />). N'importe quel composant peut ensuite
 * ouvrir ce panneau avec le contenu de son choix via
 * useBottomSheetStore().openSheet(<MonContenu />), sans que ce fichier
 * n'ait besoin de connaître ce contenu.
 */
export const GlobalBottomSheet: React.FC = () => {
  const { isOpen, content, title, closeSheet } = useBottomSheetStore();

  return (
    <BottomSheet isOpen={isOpen} onClose={closeSheet} title={title}>
      {content}
    </BottomSheet>
  );
};
