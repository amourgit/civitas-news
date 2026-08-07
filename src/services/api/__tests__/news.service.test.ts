import { describe, it, expect } from 'vitest';
import { newsService } from '../news.service';

describe('NewsService', () => {
  it('fetches list of news', async () => {
    const data = await newsService.getNewsList();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('titre');
  });

  it('fetches a single news by slug', async () => {
    const data = await newsService.getNewsList();
    const targetSlug = data[0].slug;
    const item = await newsService.getNewsBySlug(targetSlug);
    expect(item).not.toBeNull();
    expect(item?.slug).toBe(targetSlug);
  });

  it('filters news by category', async () => {
    const data = await newsService.getNewsList({ category: 'education' });
    expect(data.every((s) => s.categorie.id === 'education')).toBe(true);
  });

  it('adds a reaction to a news item', async () => {
    const data = await newsService.getNewsList();
    const newsId = data[0].id;
    const updated = await newsService.reactToNews(newsId, 'coeur');
    expect(updated.userReaction).toBe('coeur');
  });

  it('creates a news item with the new CreerNewsInput contract (categorie object, no sondages field)', async () => {
    const created = await newsService.createNews({
      titre: 'Nouvelle annonce de test',
      type: 'annonce',
      description: 'Une description de test.',
      province: 'Estuaire',
      categorie: { id: 'cat-test', nom: 'Catégorie Test', couleur: '#5B4DFF', icone: 'BookOpen' },
    });
    expect(created.titre).toBe('Nouvelle annonce de test');
    expect(created.categorie.id).toBe('cat-test');
    expect(created.province).toBe('Estuaire');
    expect(created.sondages).toEqual([]);

    const all = await newsService.getNewsList();
    expect(all.some((n) => n.id === created.id)).toBe(true);
  });

  it('increments the share counter via partagerNews', async () => {
    const data = await newsService.getNewsList();
    const before = data[0].stats.partages;
    const total = await newsService.partagerNews(data[0].id);
    expect(total).toBe(before + 1);
  });
});

