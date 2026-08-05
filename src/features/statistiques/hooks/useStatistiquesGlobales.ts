import { useEffect, useState } from 'react';
import type { StatistiquesGlobales } from '../../../types/global.types';
import { statistiquesService } from '../../../services/statistiques.service';

/**
 * Charge les statistiques globales via `statistiquesService` (qui bascule
 * automatiquement mock/réel selon `env.useMockData`). Remplace les données
 * codées en dur qui vivaient directement dans les widgets Bento
 * (BentoAreaEvolution, BentoRadialKPIs, BentoGaugeParity, BentoBarProvinces) —
 * ceux-ci doivent consommer le service, pas des tableaux locaux.
 */
export function useStatistiquesGlobales(): { stats: StatistiquesGlobales | null; isLoading: boolean } {
  const [stats, setStats] = useState<StatistiquesGlobales | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    statistiquesService
      .getStatistiquesGlobales()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((error) => console.error('Échec du chargement des statistiques globales:', error))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, isLoading };
}
