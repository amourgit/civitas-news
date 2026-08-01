import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle =
    'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5B4DFF] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 rounded-xl whitespace-nowrap';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-4 py-2.5 text-sm gap-2 rounded-xl',
    lg: 'px-6 py-3.5 text-base gap-2.5 rounded-2xl',
  };

  const variantStyles = {
    primary:
      'bg-[#5B4DFF] hover:bg-[#7B61FF] text-white shadow-md shadow-[#5B4DFF]/20 hover:shadow-lg hover:shadow-[#5B4DFF]/30 border border-transparent',
    secondary:
      'bg-[#1A1F4D] hover:bg-[#242A5C] text-white shadow-sm border border-transparent',
    ghost:
      'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 border border-transparent',
    outline:
      'bg-transparent border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-sm border border-transparent',
    glass:
      'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-white/20 text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-900 shadow-sm',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};
