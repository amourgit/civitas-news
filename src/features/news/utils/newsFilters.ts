// ============================================================
// src/features/news/utils/newsFilters.ts
// Filtrage multi-sélection appliqué CÔTÉ FRONTEND sur une liste de
// News déjà chargée.
//
// Nécessaire car DjangoFilterBackend (Backend-Core-Base
// news/api/v1/views.py: NewsViewSet.filterset_fields) ne filtre
// qu'UNE seule valeur à la fois par champ -- voir le commentaire sur
// NewsQueryParams dans services/api/repositories/news.repository.ts.
// Avec le panneau de filtres devenu multi-sélection (voir
// NewsFiltres.tsx / MultiSelectChips), on ne peut donc plus envoyer
// ces champs sur le fil : on les applique ici, sur le jeu de données
// déjà récupéré (non filtré par ces champs, éventuellement déjà
// restreint par la recherche texte côté backend).
//
// Une seule fonction `matchesFacet` couvre TOUS les champs, qu'ils
// soient à valeur simple (type, province) ou imbriqués via une FK
// (categorie.id, organisation?.id, etablissement?.id) : chaque champ
// de `NewsFacetFilters` prend un tableau de valeurs sélectionnées,
// vide/absent = aucune restriction sur ce champ (équivalent de
// l'ancienne sentinelle "all" en sélection simple).
// ============================================================

import type { News, NewsType } from '../../../types/global.types';

export interface NewsFacetFilters {
  categorieIds?: string[];
  types?: NewsType[];
  provinces?: string[];
  organisationIds?: string[];
  etablissementIds?: string[];
}

/** Vrai si `value` satisfait le facet `selected` : aucune restriction si `selected` est vide/absent. */
function matchesFacet(selected: string[] | undefined, value: string | null | undefined): boolean {
  if (!selected || selected.length === 0) return true;
  return value != null && selected.includes(value);
}

/** Applique tous les facets de `filters` (combinés en ET ; valeurs multiples d'un même facet combinées en OU). */
export function filterNewsByFacets(newsList: News[], filters: NewsFacetFilters): News[] {
  return newsList.filter(
    (news) =>
      matchesFacet(filters.categorieIds, news.categorie?.id) &&
      matchesFacet(filters.types, news.type) &&
      matchesFacet(filters.provinces, news.province ?? null) &&
      matchesFacet(filters.organisationIds, news.organisation?.id ?? null) &&
      matchesFacet(filters.etablissementIds, news.etablissement?.id ?? null),
  );
}

/** Vrai si au moins un facet a une sélection active -- pour le badge/état "filtres actifs" et l'affichage du bouton de réinitialisation. */
export function hasActiveNewsFacetFilters(filters: NewsFacetFilters): boolean {
  return Object.values(filters).some((values) => (values?.length ?? 0) > 0);
}

/** État vide pratique pour initialiser/réinitialiser les 5 facets d'un coup. */
export function emptyNewsFacetFilters(): Required<NewsFacetFilters> {
  return { categorieIds: [], types: [], provinces: [], organisationIds: [], etablissementIds: [] };
}
