import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatedTabBar, type TabItem } from '../ui/AnimatedTabBar';
import { useNavDestinations } from '../../config/navigation.config';

// Dock mobile — remplace l'ancien BottomNav.tsx. Design/animation
// repris tel quel dans AnimatedTabBar.tsx ; ce fichier ne fait que le
// câblage réel : icônes/couleurs et détection de l'onglet actif à
// partir de l'URL courante. Les destinations elles-mêmes viennent de
// config/navigation.config.ts -- SOURCE UNIQUE partagée avec la topbar
// desktop/tablette (voir Header.tsx) : ajouter/retirer une page là-bas
// se répercute automatiquement ici, sans jamais désynchroniser les
// deux listes (c'était le bug signalé : ce fichier avait auparavant
// son propre tableau DESTINATIONS, distinct de NAV_ITEMS dans
// Header.tsx).
export const MobileDock: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navDestinations = useNavDestinations();

  const activeIndexFromRoute = useMemo(() => {
    const idx = navDestinations.findIndex((d) => d.isActive(location.pathname));
    return idx === -1 ? 0 : idx;
  }, [navDestinations, location.pathname]);

  const items: TabItem[] = useMemo(
    () =>
      navDestinations.map((d) => {
        const Icon = d.icon;
        return { icon: <Icon className="icon" />, color: d.color };
      }),
    [navDestinations]
  );

  const handleTabChange = (index: number) => {
    navigate(navDestinations[index].path);
  };

  return (
    <div
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Pas de `key` ici : AnimatedTabBar reste monté en permanence et
          se resynchronise lui-même via `defaultIndex` (voir
          AnimatedTabBar.tsx) à chaque changement de route, qu'il vienne
          d'un tap sur le dock ou d'une navigation extérieure (lien
          ailleurs dans l'app, retour navigateur). Un `key` changeant à
          chaque navigation forçait un démontage/remontage complet sur
          CHAQUE tap (et pas seulement les cas "externes" comme prévu),
          ce qui repartait toujours de la position par défaut du tout
          premier onglet au lieu de glisser depuis l'onglet réellement
          actif juste avant. */}
      <AnimatedTabBar items={items} defaultIndex={activeIndexFromRoute} onTabChange={handleTabChange} />
    </div>
  );
};
