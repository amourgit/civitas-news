import { useState, useEffect } from 'react';
import { Sujet, SujetType } from '../../../types/global.types';
import { sujetsService } from '../../../services/api/sujets.service';

export function useSujets(params?: { category?: string; type?: SujetType; search?: string; province?: string }) {
  const [sujets, setSujets] = useState<Sujet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSujets = async () => {
    setIsLoading(true);
    try {
      const data = await sujetsService.getSujets(params);
      setSujets(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du chargement des sujets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSujets();
  }, [params?.category, params?.type, params?.search, params?.province]);

  return { sujets, isLoading, error, refetch: fetchSujets };
}
