import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface AvatarItem {
  id: string | number;
  name: string;
  designation?: string;
  image?: string | null;
}

export interface AvatarGroupProps {
  items: AvatarItem[];
  className?: string;
  maxVisible?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<{
  item: AvatarItem;
  index: number;
  totalItems: number;
  size: 'xs' | 'sm' | 'md' | 'lg';
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}> = ({ item, index, totalItems, size, isHovered, onHover, onLeave }) => {
  const sizeClasses = {
    xs: 'h-6 w-6 text-[9px]',
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
  };

  const initialLetter = item.name ? item.name.charAt(0).toUpperCase() : '?';

  return (
    <div
      className="relative group flex items-center justify-center shrink-0"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        marginLeft: index === 0 ? 0 : size === 'xs' ? '-0.45rem' : '-0.6rem',
        zIndex: isHovered ? 100 : totalItems - index,
      }}
    >
      <AnimatePresence mode="popLayout">
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: 'spring',
                stiffness: 220,
                damping: 18,
              },
            }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute -top-14 left-1/2 -translate-x-1/2 whitespace-nowrap flex text-xs flex-col items-center justify-center rounded-xl bg-gray-900/95 dark:bg-white/95 text-white dark:text-gray-900 z-[120] shadow-xl px-3 py-1.5 border border-white/20 dark:border-gray-800 backdrop-blur-md min-w-max pointer-events-none"
          >
            <div className="font-bold relative z-30 text-xs text-center leading-snug">
              {item.name}
            </div>
            {item.designation && (
              <div className="text-[10px] opacity-80 text-center font-medium leading-tight">
                {item.designation}
              </div>
            )}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-gray-900/95 dark:bg-white/95 border-r border-b border-white/20 dark:border-gray-800" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.18, zIndex: 100 }}
        transition={{ type: 'spring', stiffness: 220, damping: 15 }}
        className="relative shrink-0 cursor-pointer"
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className={`object-cover rounded-full border-2 border-white dark:border-[#121638] shadow-sm transition-all duration-200 ${sizeClasses[size]}`}
          />
        ) : (
          <div
            className={`rounded-full bg-gradient-to-br from-[#5B4DFF] to-[#8B5CF6] border-2 border-white dark:border-[#121638] flex items-center justify-center font-extrabold text-white shadow-sm transition-all duration-200 ${sizeClasses[size]}`}
          >
            {initialLetter}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  items,
  className = '',
  maxVisible = 4,
  size = 'xs',
}) => {
  const [hoveredId, setHoveredId] = useState<string | number | null>(null);

  if (!items || items.length === 0) return null;

  const visibleItems = items.slice(0, maxVisible);
  const remainingCount = items.length - maxVisible;

  const badgeSizeClasses = {
    xs: 'h-6 w-6 text-[9px] -ml-1.5',
    sm: 'h-7 w-7 text-[10px] -ml-2',
    md: 'h-9 w-9 text-xs -ml-2.5',
    lg: 'h-11 w-11 text-sm -ml-3',
  };

  return (
    <div className={`flex items-center ${className}`}>
      {visibleItems.map((item, index) => (
        <Avatar
          key={item.id}
          item={item}
          index={index}
          totalItems={visibleItems.length}
          size={size}
          isHovered={hoveredId === item.id}
          onHover={() => setHoveredId(item.id)}
          onLeave={() => setHoveredId(null)}
        />
      ))}

      {remainingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-center justify-center rounded-full border-2 border-white dark:border-[#121638] bg-gray-800 dark:bg-gray-700 text-white font-extrabold shadow-sm shrink-0 ${badgeSizeClasses[size]}`}
          title={`et ${remainingCount} autres`}
        >
          +{remainingCount}
        </motion.div>
      )}
    </div>
  );
};

export default AvatarGroup;
