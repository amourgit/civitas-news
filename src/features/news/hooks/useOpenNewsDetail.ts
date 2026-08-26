import { createElement } from 'react';
import { useBottomSheetStore } from '../../../store/bottomSheet.store';
import { NewsDetailContent } from '../components/NewsDetailContent';

/**
 * Remplace les anciens `<Link to={`/news/${slug}`}>` / `navigate(...)`
 * vers la page de détail (débranchée, voir App.tsx) : ouvre désormais
 * le BottomSheet générique avec le contenu de la News/Sujet visé.
 * Utilisable depuis n'importe quel composant (cards, carrousel,
 * widgets de stats, redirection post-création...).
 */
export function useOpenNewsDetail() {
  const { openSheet, closeSheet } = useBottomSheetStore();

  return (slug: string) => {
    openSheet(createElement(NewsDetailContent, { slug, onClose: closeSheet }));
  };
}
