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
    <div className="w-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900 shadow-sm">
      {isVideo ? (
        <video
          src={heroMedia}
          className="w-full max-h-[520px] object-cover"
          muted
          loop
          playsInline
          autoPlay
          aria-label={news.titre}
        />
      ) : (
        <img src={heroMedia} alt={news.titre} className="w-full max-h-[520px] object-cover" />
      )}
    </div>
  );
};
