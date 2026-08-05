// ============================================================
// src/services/api/utils/pagination.ts
// Le backend (DRF PageNumberPagination, voir config/settings.py côté
// Backend-Core-Base) enveloppe TOUTES les réponses de liste dans :
//   { count, next, previous, results: [...] }
// — jamais un tableau nu. Ce module centralise :
//   1) le schéma Zod générique pour valider cette enveloppe ;
//   2) `fetchAllPages`, qui suit `next` page après page et retourne
//      la liste complète, pour que chaque repository continue
//      d'exposer `Promise<T[]>` sans que les hooks/composants
//      appelants aient à connaître la pagination.
// ============================================================

import { z } from 'zod';

/** Enveloppe générique `{ count, next, previous, results }` d'une réponse de liste DRF. */
export function paginatedSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    count: z.number().int().nonnegative(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(itemSchema),
  });
}

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export interface PageResult<T> {
  results: T[];
  next: string | null;
}

/**
 * Récupère toutes les pages d'une liste DRF paginée et retourne la
 * concaténation de leurs `results`.
 *
 * `fetchPage(page)` doit effectuer l'appel HTTP pour le numéro de page
 * donné (1-indexé, comme `PageNumberPagination`) et retourner
 * explicitement `{ results, next }` (construits par l'appelant à partir
 * de `response.data`, plutôt que `response.data` transmis tel quel —
 * plus robuste face aux subtilités d'inférence de type entre Zod et les
 * génériques de `GetService`). `maxPages` est un garde-fou pour ne
 * jamais boucler indéfiniment si le backend renvoyait un `next`
 * incohérent.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<PageResult<T>>,
  maxPages: number = 50
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;

  while (page <= maxPages) {
    const { results, next } = await fetchPage(page);
    all.push(...results);
    if (!next) break;
    page += 1;
  }

  return all;
}
