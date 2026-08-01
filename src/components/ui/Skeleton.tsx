import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  height?: string | number;
  width?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  height,
  width,
}) => {
  const variantStyles = {
    text: 'h-4 rounded-md w-full',
    circular: 'rounded-full shrink-0',
    rectangular: 'rounded-2xl w-full',
    card: 'rounded-3xl h-64 w-full',
  };

  const style: React.CSSProperties = {
    height,
    width,
  };

  return (
    <div
      style={style}
      className={`animate-pulse bg-gray-200 dark:bg-gray-800 ${variantStyles[variant]} ${className}`}
    />
  );
};
