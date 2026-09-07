import { useCallback } from 'react';
import { useAsyncResource } from '../../../hooks/useAsyncResource';
import { statistiquesRepository } from '../../../services/api/repositories/statistiques.repository';
import type { MesStatistiques } from '../../../types/global.types';
import { useAuthStore } from '../../../store/auth.store';

/**
 * Statistiques PERSONNELLES de l'utilisateur connecté (page Profil) --
 * GET /statistiques/v1/moi/ (statistiques/api/v1/views.py:MesStatistiquesView).
 *
 * Volontairement toujours branché sur `statistiquesRepository` (jamais sur
 * `statistiquesService`, qui bascule vers des données fictives selon
 * `env.useMockData`) : la page Profil ne doit plus jamais afficher de
 * donnée mock ou figée, quel que soit l'environnement.
 *
 * Le fetcher est désactivé (`null`) tant que la session n'est pas hydratée
 * ou que l'utilisateur est anonyme -- sinon un premier appel partirait
 * systématiquement en échec (401) avant que la vraie session ne soit
 * connue, doublant inutilement la requête juste après hydratation.
 */
export function useMesStatistiques(): {
  stats: MesStatistiques | null;
  isLoading: boolean;
  error: string | null;
} {
  const { isAuthenticated, isHydrating } = useAuthStore();
  const fetcher = useCallback(() => statistiquesRepository.getMoi(), []);
  const pretACharger = !isHydrating && isAuthenticated;

  const { data, isLoading, error } = useAsyncResource<MesStatistiques>(
    pretACharger ? fetcher : null,
    [pretACharger]
  );

  return { stats: data, isLoading: isHydrating || isLoading, error };
}
