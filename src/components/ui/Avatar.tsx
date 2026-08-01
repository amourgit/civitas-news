import React from 'react';

export interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  badge?: React.ReactNode;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  badge,
}) => {
  const sizeMap = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const getInitials = (n: string) => {
    if (!n) return 'C';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.substring(0, 2).toUpperCase();
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full aspect-square ${sizeMap[size]} ${className}`}
      style={{ borderRadius: '50%' }}
    >
      <div
        className="w-full h-full rounded-full overflow-hidden shrink-0 aspect-square ring-1 ring-white dark:ring-gray-800 shadow-sm flex items-center justify-center"
        style={{ borderRadius: '50%' }}
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover rounded-full aspect-square block"
            style={{ borderRadius: '50%' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
        {(!src || true) && (
          <div
            className={`w-full h-full ${src ? 'hidden' : 'flex'} items-center justify-center rounded-full bg-gradient-to-br from-[#5B4DFF] to-[#1A1F4D] text-white font-bold`}
            style={{ borderRadius: '50%' }}
          >
            {getInitials(name)}
          </div>
        )}
      </div>
      {badge && <div className="absolute -bottom-0.5 -right-0.5 z-10">{badge}</div>}
    </div>
  );
};
