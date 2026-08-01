import React from 'react';
import { SujetType } from '../../types/global.types';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'type' | 'status' | 'outline' | 'purple' | 'success' | 'warning' | 'danger';
  type?: SujetType;
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

const TYPE_CONFIG: Record<SujetType, { label: string; bg: string; text: string }> = {
  projet: { label: 'Projet', bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300' },
  evenement: { label: 'Événement', bg: 'bg-cyan-100 dark:bg-cyan-950', text: 'text-cyan-700 dark:text-cyan-300' },
  annonce: { label: 'Annonce', bg: 'bg-indigo-100 dark:bg-indigo-950', text: 'text-indigo-700 dark:text-indigo-300' },
  sondage: { label: 'Sondage', bg: 'bg-purple-100 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300' },
  consultation: { label: 'Consultation', bg: 'bg-violet-100 dark:bg-violet-950', text: 'text-violet-700 dark:text-violet-300' },
  petition: { label: 'Pétition', bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300' },
  information: { label: 'Information', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
  reforme: { label: 'Réforme', bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300' },
  idee: { label: 'Idée', bg: 'bg-yellow-100 dark:bg-yellow-950', text: 'text-yellow-800 dark:text-yellow-300' },
  conference: { label: 'Conférence', bg: 'bg-teal-100 dark:bg-teal-950', text: 'text-teal-700 dark:text-teal-300' },
  reunion: { label: 'Réunion', bg: 'bg-sky-100 dark:bg-sky-950', text: 'text-sky-700 dark:text-sky-300' },
  atelier: { label: 'Atelier', bg: 'bg-fuchsia-100 dark:bg-fuchsia-950', text: 'text-fuchsia-700 dark:text-fuchsia-300' },
  appel_participation: { label: 'Appel', bg: 'bg-rose-100 dark:bg-rose-950', text: 'text-rose-700 dark:text-rose-300' },
  article: { label: 'Article', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' },
  publication: { label: 'Publication', bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-700 dark:text-zinc-300' },
  actualite: { label: 'Actualité', bg: 'bg-orange-100 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300' },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  type,
  size = 'md',
  className = '',
  icon,
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs font-medium rounded-md gap-1' : 'px-2.5 py-1 text-xs font-semibold rounded-lg gap-1.5';

  if (variant === 'type' && type && TYPE_CONFIG[type]) {
    const conf = TYPE_CONFIG[type];
    return (
      <span className={`inline-flex items-center ${sizeClasses} ${conf.bg} ${conf.text} ${className}`}>
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{children || conf.label}</span>
      </span>
    );
  }

  const variantStyles = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    type: 'bg-[#5B4DFF]/10 text-[#5B4DFF]',
    status: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    outline: 'border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300',
    purple: 'bg-[#5B4DFF] text-white',
    success: 'bg-emerald-500 text-white',
    warning: 'bg-amber-500 text-white',
    danger: 'bg-red-500 text-white',
  };

  return (
    <span className={`inline-flex items-center ${sizeClasses} ${variantStyles[variant]} ${className}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
