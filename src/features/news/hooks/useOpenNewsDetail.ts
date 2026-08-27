import { createElement } from 'react';
import { useBottomSheetStore } from '../../../store/bottomSheet.store';
import { NewsDetailContentLoader } from '../components/NewsDetailContentLoader';

/**
 * Ouvre le BottomSheet générique avec les détails d'une News/Sujet pour
 * un slug donné -- à utiliser depuis n'importe quel composant qui n'a
 * pas déjà son propre état local de sélection (NewsCard s'en sert par
 * défaut quand son parent ne fournit pas onOpenDetail ; sinon utilisé
 * directement par NetflixHeroCarousel, les widgets de stats, le lien de
 * retour de SondageFocusPage, la redirection post-création...).
 * Remplace les anciens `<Link to={`/news/${slug}`}>` / `navigate(...)`
 * vers la page de détail, débranchée (voir App.tsx).
 */
export function useOpenNewsDetail() {
  const { openSheet } = useBottomSheetStore();

  return (slug: string) => {
    openSheet(createElement(NewsDetailContentLoader, { slug }));
  };
}
