import { describe, it, expect, vi } from 'vitest';
import { fetchAllPages } from '../utils/pagination';

describe('fetchAllPages', () => {
  it('accumule les résultats de toutes les pages jusqu\'à next: null', async () => {
    const pages: Record<number, { results: number[]; next: string | null }> = {
      1: { results: [1, 2, 3], next: '/api/x/?page=2' },
      2: { results: [4, 5, 6], next: '/api/x/?page=3' },
      3: { results: [7], next: null },
    };
    const fetchPage = vi.fn(async (page: number) => pages[page]);

    const all = await fetchAllPages(fetchPage);

    expect(all).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(fetchPage).toHaveBeenNthCalledWith(1, 1);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 2);
    expect(fetchPage).toHaveBeenNthCalledWith(3, 3);
  });

  it('renvoie un tableau vide pour une liste vide (une seule page, résultats vides)', async () => {
    const fetchPage = vi.fn(async () => ({ results: [], next: null }));

    const all = await fetchAllPages(fetchPage);

    expect(all).toEqual([]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('s\'arrête après une seule page quand next est déjà null', async () => {
    const fetchPage = vi.fn(async () => ({ results: ['a', 'b'], next: null }));

    const all = await fetchAllPages(fetchPage);

    expect(all).toEqual(['a', 'b']);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('respecte le garde-fou maxPages pour ne jamais boucler indéfiniment', async () => {
    // `next` toujours non-null : sans garde-fou, ceci boucle à l'infini.
    const fetchPage = vi.fn(async (page: number) => ({ results: [page], next: `page=${page + 1}` }));

    const all = await fetchAllPages(fetchPage, 5);

    expect(all).toEqual([1, 2, 3, 4, 5]);
    expect(fetchPage).toHaveBeenCalledTimes(5);
  });
});
