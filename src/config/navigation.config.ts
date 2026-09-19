// ============================================================
// src/config/navigation.config.ts
// Source UNIQUE de vérité pour la navigation principale de l'app.
// La topbar desktop/tablette (Header.tsx -> NotchNav, menu central)
// ET le dock mobile (MobileDock.tsx -> AnimatedTabBar) consomment
// tous les deux CE MÊME tableau via useNavDestinations() : ajouter,
// retirer, réordonner ou changer la permission requise d'une
// destination ici se répercute automatiquement aux deux endroits,
// sans jamais risquer une désynchronisation entre les deux listes
// (elles étaient auparavant deux tableaux distincts et divergents :
// NAV_ITEMS dans Header.tsx vs DESTINATIONS dans MobileDock.tsx).
//
// Le filtrage par permission (voir lib/permissions/) est fait UNE
// SEULE FOIS ici, dans le hook, plutôt que dupliqué dans chaque
// composant consommateur -- même liste, même règle de visibilité,
// partout.
// ============================================================

import type { ComponentType } from 'react';
import { Home, Layers, Search, Vote, Video, BarChart3, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usePermissions } from '../lib/permissions/usePermissions';
import { PERMISSIONS, type Permission } from '../lib/permissions/permissions.catalog';

export interface NavDestination {
  id: string;
  label: string;
  icon: LucideIcon | ComponentType<{ className?: string }>;
  /** Couleur d'accent utilisée par le dock mobile (voir
   *  AnimatedTabBar.tsx / --bgColorItem) ; NotchNav (desktop) ne
   *  colore pas ses items individuellement, mais la couleur reste
   *  centralisée ici avec le reste de la destination plutôt que
   *  redéclarée localement dans MobileDock.tsx. */
  color: string;
  path: string;
  /** Permission requise pour VOIR cette destination, topbar ET dock.
   *  Absente = visible par tous, y compris un visiteur anonyme (voir
   *  ANONYME dans rolePermissions.ts). */
  permission?: Permission;
  isActive: (pathname: string) => boolean;
}

export const NAV_DESTINATIONS: NavDestination[] = [
  {
    id: 'accueil',
    label: 'Accueil',
    icon: Home,
    color: 'var(--civitas-purple)',
    path: '/',
    isActive: (pathname) => pathname === '/',
  },
  {
    id: 'news',
    label: 'News',
    icon: Layers,
    color: 'var(--civitas-info)',
    path: '/news',
    // Couvre aussi /sujets/* : ancienne URL des pages de détail
    // News/Sondage (voir App.tsx) -- même destination logique.
    isActive: (pathname) => pathname.startsWith('/news') || pathname.startsWith('/sujets'),
  },
  {
    id: 'recherche',
    label: 'Rechercher',
    icon: Search,
    color: 'var(--civitas-teal)',
    path: '/recherche',
    isActive: (pathname) => pathname.startsWith('/recherche'),
  },
  {
    id: 'sondages',
    label: 'Sondage',
    icon: Vote,
    color: 'var(--civitas-purple-accent)',
    path: '/sondages',
    isActive: (pathname) => pathname.startsWith('/sondages'),
  },
  {
    id: 'reels',
    label: 'Reels et Directs',
    icon: Video,
    color: 'var(--civitas-warning)',
    path: '/reels',
    isActive: (pathname) => pathname.startsWith('/reels'),
  },
  {
    id: 'statistiques',
    label: 'Statistiques',
    icon: BarChart3,
    color: 'var(--civitas-rose)',
    path: '/statistiques',
    // Aligné sur le rôle minimum qui accorde déjà STATISTIQUES_VIEW
    // (organisation+, voir rolePermissions.ts) : un(e) anonyme ou
    // étudiant(e) ne voyait déjà pas ce lien sur la topbar desktop --
    // comportement conservé, désormais aussi appliqué au dock mobile.
    permission: PERMISSIONS.STATISTIQUES_VIEW,
    isActive: (pathname) => pathname.startsWith('/statistiques'),
  },
  {
    id: 'profil',
    label: 'Profil',
    icon: User,
    color: 'var(--civitas-success)',
    path: '/profil',
    isActive: (pathname) => pathname.startsWith('/profil'),
  },
];

/**
 * Liste filtrée par permission de l'utilisateur courant -- LA liste à
 * utiliser dans les deux composants de navigation (topbar ET dock),
 * jamais NAV_DESTINATIONS brut directement dans un composant.
 */
export function useNavDestinations(): NavDestination[] {
  const { can } = usePermissions();
  return NAV_DESTINATIONS.filter((destination) => !destination.permission || can(destination.permission));
}
