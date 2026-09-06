import { useEffect, useState } from 'react';
import type { StatistiquesGlobales } from '../../../types/global.types';
import { statistiquesService } from '../../../services/api/statistiques.service';

/**
 * Charge les statistiques globales via `statistiquesService` (qui bascule
 * automatiquement mock/réel selon `env.useMockData`). Remplace les données
 * codées en dur qui vivaient directement dans les widgets Bento
 * (BentoAreaEvolution, BentoRadialKPIs, BentoGaugeParity, BentoBarProvinces) —
 * ceux-ci doivent consommer le service, pas des tableaux locaux.
 *
 * Expose `error` : sans lui, un échec laissait `stats` à `null` et
 * `isLoading` à `false` indéfiniment -- les pages qui gardaient une garde
 * `if (isLoading || !stats)` restaient bloquées sur leur squelette de
 * chargement pour toujours au lieu d'afficher un état vide explicite.
 */
export function useStatistiquesGlobales(): {
  stats: StatistiquesGlobales | null;
  isLoading: boolean;
  error: string | null;
} {
  const [stats, setStats] = useState<StatistiquesGlobales | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    statistiquesService
      .getStatistiquesGlobales()
      .then((data) => {
        if (!cancelled) {
          setStats(data);
          setError(null);
        }
      })
      .catch((err) => {
        console.error('Échec du chargement des statistiques globales:', err);
        if (!cancelled) setError(err?.message || 'Impossible de charger les statistiques.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, isLoading, error };
}
