import React from 'react';
import { News } from '../../../../types/global.types';

export interface NewsDetailCoverImageProps {
  news: News;
}

export const NewsDetailCoverImage: React.FC<NewsDetailCoverImageProps> = ({ news }) => {
  const heroMedia = news.image || news.galerie?.[0]?.url || null;
  if (!heroMedia) return null;

  const isVideo = heroMedia.endsWith('.mp4') || heroMedia.endsWith('.webm') || heroMedia.includes('video');

  return (
    // aspect-video : réserve la hauteur AVANT le chargement du média
    // (même pattern déjà utilisé dans NewsMediaGallery.tsx). Sans ça,
    // le conteneur n'a aucune hauteur tant que l'image/vidéo n'est pas
    // chargée, puis "saute" d'un coup à sa hauteur réelle une fois
    // chargée -- décalage de tout le contenu en dessous, perçu comme
    // un zoom/saut de la page. max-h-[520px] reste une limite haute
    // supplémentaire sur les très grands écrans (aspect-video seul y
    // donnerait une hauteur plus grande que le rendu d'origine).
    <div className="w-full aspect-video max-h-[520px] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900 shadow-sm">
      {isVideo ? (
        <video
          src={heroMedia}
          className="w-full h-full object-cover"
          muted
          loop
          playsInline
          autoPlay
          aria-label={news.titre}
        />
      ) : (
        <img src={heroMedia} alt={news.titre} className="w-full h-full object-cover" />
      )}
    </div>
  );
};
