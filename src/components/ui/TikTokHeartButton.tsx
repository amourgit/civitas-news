import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';
import { newsService } from '../../services/news.service';
import { formatNumber } from '../../lib/formatNumber';

interface FloatingHeart {
  id: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
  emoji?: string;
}

interface TikTokHeartButtonProps {
  newsId: string;
  initialCount: number;
  userReaction?: string | null;
  onUpdate?: (updated: any) => void;
  className?: string;
}

const HEART_COLORS = [
  '#EF4444', // red-500
  '#EC4899', // pink-500
  '#F43F5E', // rose-500
  '#8B5CF6', // purple-500
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
];

const HEART_EMOJIS = ['❤️', '💖', '💗', '💓', '💕', '✨'];

export const TikTokHeartButton: React.FC<TikTokHeartButtonProps> = ({
  newsId,
  initialCount,
  userReaction,
  onUpdate,
  className = '',
}) => {
  const [count, setCount] = useState<number>(initialCount);
  const [hasHearted, setHasHearted] = useState<boolean>(userReaction === 'coeur');
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    setHasHearted(userReaction === 'coeur');
  }, [userReaction]);

  const handleTap = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // 1. Increment local exact count immediately
    const nextCount = count + 1;
    setCount(nextCount);
    setHasHearted(true);

    // 2. Create floating heart particles (1 to 2 hearts per tap)
    const particleCount = Math.floor(Math.random() * 2) + 1;
    const newParticles: FloatingHeart[] = [];

    for (let i = 0; i < particleCount; i++) {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const x = (Math.random() - 0.5) * 60; // horizontal drift -30px to +30px
      const y = -90 - Math.random() * 60; // float up -90px to -150px
      const scale = 0.8 + Math.random() * 0.7; // scale 0.8 to 1.5
      const rotation = (Math.random() - 0.5) * 40; // rotate -20deg to +20deg
      const color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
      const emoji = Math.random() > 0.4 ? HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)] : undefined;

      newParticles.push({ id, x, y, scale, rotation, color, emoji });
    }

    setFloatingHearts((prev) => [...prev.slice(-25), ...newParticles]);

    // 3. Sync backend / memory store
    try {
      const updated = await newsService.incrementHeart(newsId, 1);
      if (onUpdate) onUpdate(updated);
    } catch (err) {
      console.error('Error incrementing heart:', err);
    }
  };

  const removeParticle = (id: string) => {
    setFloatingHearts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* Floating Hearts Container */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 pointer-events-none w-24 h-44 overflow-visible z-50">
        <AnimatePresence>
          {floatingHearts.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                opacity: 1,
                scale: 0.3,
                x: 0,
                y: 0,
                rotate: 0,
              }}
              animate={{
                opacity: [1, 1, 0],
                scale: [0.4, particle.scale, particle.scale * 1.25],
                x: particle.x,
                y: particle.y,
                rotate: particle.rotation,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.25,
                ease: [0.22, 1, 0.36, 1],
              }}
              onAnimationComplete={() => removeParticle(particle.id)}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 select-none"
            >
              {particle.emoji ? (
                <span className="text-xl sm:text-2xl drop-shadow-md">{particle.emoji}</span>
              ) : (
                <Heart
                  className="w-5 h-5 sm:w-6 sm:h-6 fill-current drop-shadow-md"
                  style={{ color: particle.color }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main TikTok Tap Button */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        onClick={handleTap}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-none text-[11px] font-extrabold transition-all duration-150 select-none cursor-pointer ${
          hasHearted
            ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-sm shadow-red-500/30'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:text-red-500 hover:border-red-300 dark:hover:border-red-500/50'
        }`}
        title="Tapotez plusieurs fois pour envoyer des cœurs !"
      >
        <motion.div
          key={count}
          initial={{ scale: 1.35 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          <Heart className={`w-3.5 h-3.5 ${hasHearted ? 'fill-current text-white' : 'text-red-500'}`} />
        </motion.div>
        <span>Soutenir ({formatNumber(count)})</span>
      </motion.button>
    </div>
  );
};
