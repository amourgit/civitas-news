// ============================================================
// src/features/news/hooks/useReferentiels.ts
// Charge les données de référence (Catégorie, Organisation,
// Établissement) via referentielsService — bascule automatique
// mock/réel selon env.useMockData (voir services/api/referentiels.service.ts).
//
// Chaque référentiel est déjà « sans doublon » par construction : ce
// sont les enregistrements RÉELS des tables referentiels.Categorie /
// Organisation / Etablissement (chacun avec un id unique), pas une
// liste dérivée des News chargées. C'est la source à utiliser pour
// peupler tout sélecteur dont les options proviennent d'une table
// liée (contrairement aux champs à choix fixes comme `type`/`province`,
// voir features/news/constants/newsFieldOptions.ts).
//
// Un seul chargement partagé par montage de composant appelant —
// pensé pour être réutilisé par tout composant ayant besoin de ces
// trois listes (NewsFiltres, CreerNewsPage, backoffice...).
// ============================================================

import { useEffect, useState } from 'react';
import type { Categorie, Organisation, Etablissement } from '../../../types/global.types';
import { referentielsService } from '../../../services/api/referentiels.service';

export interface UseReferentielsResult {
  categories: Categorie[];
  organisations: Organisation[];
  etablissements: Etablissement[];
  isLoading: boolean;
  error: string | null;
}

export function useReferentiels(): UseReferentielsResult {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([
      referentielsService.getCategories(),
      referentielsService.getOrganisations(),
      referentielsService.getEtablissements(),
    ])
      .then(([cats, orgs, etabs]) => {
        if (cancelled) return;
        setCategories(cats);
        setOrganisations(orgs);
        setEtablissements(etabs);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des référentiels');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, organisations, etablissements, isLoading, error };
}
