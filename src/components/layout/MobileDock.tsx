import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Layers, Vote, Video, User } from 'lucide-react';
import { AnimatedTabBar, type TabItem } from '../ui/AnimatedTabBar';

// Dock mobile — remplace l'ancien BottomNav.tsx. Design/animation
// repris tel quel dans AnimatedTabBar.tsx ; ce fichier ne fait que le
// câblage réel : les 5 destinations, leurs icônes/couleurs, et la
// détection de l'onglet actif à partir de l'URL courante.
interface DockDestination {
  label: string;
  icon: React.ReactNode;
  color: string;
  path: string;
  isActive: (pathname: string, search: URLSearchParams) => boolean;
}

const DESTINATIONS: DockDestination[] = [
  {
    label: 'Home',
    icon: <Home className="icon" />,
    color: '#5B4DFF', // --civitas-purple
    path: '/',
    isActive: (pathname) => pathname === '/',
  },
  {
    label: 'News',
    icon: <Layers className="icon" />,
    color: '#3B82F6', // --civitas-info
    path: '/news',
    isActive: (pathname, search) =>
      (pathname.startsWith('/news') || pathname.startsWith('/sujets')) && search.get('type') !== 'sondage',
  },
  {
    label: 'Sondage',
    icon: <Vote className="icon" />,
    color: '#7B61FF', // --civitas-purple-accent
    path: '/news?type=sondage',
    isActive: (pathname, search) =>
      (pathname.startsWith('/news') || pathname.startsWith('/sujets')) && search.get('type') === 'sondage',
  },
  {
    label: 'Reels et Directs',
    icon: <Video className="icon" />,
    color: '#F59E0B', // --civitas-warning
    path: '/reels',
    isActive: (pathname) => pathname.startsWith('/reels'),
  },
  {
    label: 'Profil',
    icon: <User className="icon" />,
    color: '#16A34A', // --civitas-success
    path: '/profil',
    isActive: (pathname) => pathname.startsWith('/profil'),
  },
];

export const MobileDock: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const search = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const activeIndexFromRoute = useMemo(() => {
    const idx = DESTINATIONS.findIndex((d) => d.isActive(location.pathname, search));
    return idx === -1 ? 0 : idx;
  }, [location.pathname, search]);

  const items: TabItem[] = DESTINATIONS.map((d) => ({ icon: d.icon, color: d.color }));

  const handleTabChange = (index: number) => {
    navigate(DESTINATIONS[index].path);
  };

  return (
    <div
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* `key` force un remontage (donc une resynchro de defaultIndex)
          uniquement quand l'onglet actif change pour une raison
          EXTÉRIEURE au dock lui-même (lien ailleurs dans l'app, retour
          navigateur) : un tap direct sur le dock ne provoque jamais ce
          remontage, puisque l'index recalculé depuis la route est déjà
          celui que le dock vient d'afficher — AnimatedTabBar.tsx garde
          donc sa propre logique d'état interne strictement inchangée. */}
      <AnimatedTabBar key={activeIndexFromRoute} items={items} defaultIndex={activeIndexFromRoute} onTabChange={handleTabChange} />
    </div>
  );
};
