import { useState, useEffect } from 'react';
import { Sujet } from '../../../types/global.types';
import { sujetsService } from '../../../services/sujets.service';

export function useSujet(slug?: string) {
  const [sujet, setSujet] = useState<Sujet | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    setIsLoading(true);

    sujetsService
      .getSujetBySlug(slug)
      .then((data) => {
        if (isMounted) {
          setSujet(data);
          setError(data ? null : 'Sujet introuvable');
        }
      })
      .catch((err) => {
        if (isMounted) setError(err?.message || 'Erreur lors du chargement');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { sujet, setSujet, isLoading, error };
}
