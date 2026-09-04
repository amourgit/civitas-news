import React from 'react';
import { News } from '../../../../types/global.types';
import { RichTextViewer } from '../../../../components/ui/RichTextViewer';

export interface NewsDetailArticleBodyProps {
  news: News;
}

/**
 * Corps de l'article -- le "chapeau" (news.description) est déjà
 * affiché en tête de page par NewsDetailHero, donc on ne montre ici
 * que le contenu complet (news.contenu), sans dupliquer le résumé. Les
 * mots-clés vivent dans le widget "Catégorie & mots-clés" de la
 * sidebar (voir sidebar/CategoryTagsWidget.tsx), comme dans les
 * maquettes de référence -- pas dupliqués ici. Repose entièrement sur
 * RichTextViewer (rendu markdown déjà utilisé partout ailleurs dans
 * l'app) en échelle typographique élargie (articleSize) pour une
 * lecture confortable en pleine page.
 */
export const NewsDetailArticleBody: React.FC<NewsDetailArticleBodyProps> = ({ news }) => {
  const hasFullContent = !!news.contenu && news.contenu.trim() !== '' && news.contenu.trim() !== news.description?.trim();

  if (!hasFullContent) return null;

  return (
    <div className="w-full">
      <RichTextViewer content={news.contenu!} articleSize />
    </div>
  );
};
