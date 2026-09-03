import { useCallback, useEffect, useState } from 'react';
import { meteoService } from '../services/meteo.service';
import type { MeteoProvince } from '../types/meteo.types';

/**
 * Charge la météo des 9 provinces du Gabon via `meteoService` (mock
 * autonome, voir services/meteo.service.ts). Même contrat que les autres
 * hooks de données du projet (isLoading, annulation sur unmount) afin que
 * `MeteoLiquidGlassSection` reste un simple composant de présentation.
 */
export function useMeteo(): { meteo: MeteoProvince[] | null; isLoading: boolean; refresh: () => void } {
  const [meteo, setMeteo] = useState<MeteoProvince[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    meteoService
      .getMeteoParProvinces()
      .then((data) => {
        if (!cancelled) setMeteo(data);
      })
      .catch((error) => console.error('Échec du chargement de la météo:', error))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return { meteo, isLoading, refresh };
}
