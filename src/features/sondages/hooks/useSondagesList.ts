import { useState, useEffect, useCallback } from 'react';
import { Sondage } from '../../../types/global.types';
import { sondagesService } from '../../../services/api/sondages.service';

/**
 * Charge la liste complète des sondages existants (voir
 * sondagesService.listSondages) -- utilisé par la page dédiée
 * /sondages (SondagesListPage.tsx), sur le même modèle que
 * useNewsList pour la page News.
 */
export function useSondagesList() {
  const [sondages, setSondages] = useState<Sondage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSondages = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await sondagesService.listSondages();
      setSondages(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du chargement des sondages');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSondages();
  }, [fetchSondages]);

  const handleUpdateSondage = (updated: Sondage) => {
    setSondages((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  return { sondages, isLoading, error, refetch: fetchSondages, onUpdateSondage: handleUpdateSondage };
}
