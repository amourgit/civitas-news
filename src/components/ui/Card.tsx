import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  hover = false,
  children,
  className = '',
  ...props
}) => {
  const baseStyle = 'rounded-none transition-all duration-200 overflow-hidden';

  const variantStyles = {
    default:
      'bg-white dark:bg-[#1A1F4D] border border-gray-100 dark:border-gray-800 shadow-[0_1px_2px_rgba(17,24,39,0.04)] hover:shadow-[0_4px_12px_rgba(91,77,255,0.08)]',
    glass:
      'bg-white/70 dark:bg-[#1A1F4D]/70 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-[0_4px_12px_rgba(91,77,255,0.06)]',
    elevated:
      'bg-white dark:bg-[#1A1F4D] shadow-[0_8px_24px_rgba(26,31,77,0.12)] border border-gray-100 dark:border-gray-800',
    bordered:
      'bg-white dark:bg-[#1A1F4D] border-2 border-gray-200 dark:border-gray-700',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-1',
    md: 'p-1.5 sm:p-2',
    lg: 'p-2 sm:p-3',
  };

  return (
    <div
      className={`${baseStyle} ${variantStyles[variant]} ${paddingStyles[padding]} ${hover ? 'hover:-translate-y-1' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
