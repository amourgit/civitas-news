import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { News } from '../../../../types/global.types';
import { useNewsReactions } from '../../hooks/useNewsReactions';
import { formatNumber } from '../../../../lib/formatNumber';

export interface NewsDetailLikeButtonProps {
  news: News;
  onUpdate?: (updated: News) => void;
  className?: string;
}

/**
 * Variante discrète (fond clair, ligne éditoriale) du bouton cœur --
 * MÊME logique métier que TikTokHeartButton (voir components/ui/) :
 * un tap = une réaction "coeur" de plus, sans toggle ni limite, mise
 * en file via useNewsReactions pour ne jamais perdre un tap rapide.
 * Seule la présentation change (celle de TikTokHeartButton, pensée
 * pour une image de couverture avec drop-shadow, ne convient pas ici).
 */
export const NewsDetailLikeButton: React.FC<NewsDetailLikeButtonProps> = ({ news, onUpdate, className = '' }) => {
  const [count, setCount] = useState(news.stats.reactions.coeur || 0);
  const [hasLiked, setHasLiked] = useState(news.userReaction === 'coeur');
  const { react } = useNewsReactions(news.id, onUpdate);

  useEffect(() => setCount(news.stats.reactions.coeur || 0), [news.stats.reactions.coeur]);
  useEffect(() => setHasLiked(news.userReaction === 'coeur'), [news.userReaction]);

  const handleTap = () => {
    setCount((c) => c + 1);
    setHasLiked(true);
    react('coeur').catch((err) => console.error('Erreur réaction news:', err));
  };

  return (
    <motion.button
      type="button"
      onClick={handleTap}
      whileTap={{ scale: 0.9 }}
      className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-colors ${
        hasLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
      } ${className}`}
      title="Réagir à cette publication"
    >
      <motion.span key={count} initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }}>
        <Heart className={`w-[18px] h-[18px] ${hasLiked ? 'fill-current' : ''}`} />
      </motion.span>
      <span>{formatNumber(count)}</span>
    </motion.button>
  );
};
