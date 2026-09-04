import React from 'react';

export interface SidebarWidgetCardProps {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Retire le padding interne -- utile quand le widget gère lui-même
   * sa mise en page (ex: liste d'articles avec vignettes bord à bord). */
  noPadding?: boolean;
}

/**
 * Enveloppe visuelle commune à tous les widgets de la sidebar de la
 * page détail -- carte blanche/navy, coins arrondis, ombre légère.
 * Simple habillage présentationnel, aucune logique.
 */
export const SidebarWidgetCard: React.FC<SidebarWidgetCardProps> = ({
  title,
  icon,
  children,
  className = '',
  noPadding = false,
}) => {
  return (
    <section
      className={`rounded-2xl bg-white dark:bg-[#161B40] border border-gray-100 dark:border-gray-800/80 shadow-sm overflow-hidden ${className}`}
    >
      {title && (
        <div className="flex items-center gap-2 px-5 pt-4 pb-3">
          {icon && <span className="text-[#5B4DFF] dark:text-sky-300">{icon}</span>}
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white font-display">{title}</h3>
        </div>
      )}
      <div className={noPadding ? '' : `px-5 ${title ? 'pb-5' : 'py-5'}`}>{children}</div>
    </section>
  );
};
