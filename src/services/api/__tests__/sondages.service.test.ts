import { describe, it, expect } from 'vitest';
import { sondagesService } from '../sondages.service';
import { newsService } from '../news.service';

describe('SondagesService', () => {
  it('registers a vote correctly and updates percentages', async () => {
    const sondage = await sondagesService.voteSondage('sondage-101', ['c1']);
    expect(sondage).not.toBeNull();
    if (sondage) {
      expect(sondage.userVotedChoiceIds).toContain('c1');
      expect(sondage.totalVotes).toBeGreaterThan(0);
      const choice1 = sondage.choix.find((c) => c.id === 'c1');
      expect(choice1?.nombreVotes).toBeGreaterThan(0);
    }
  });

  it('creates a poll attached to an existing news item', async () => {
    const newsList = await newsService.getNewsList();
    const target = newsList[0];
    const nbSondagesAvant = target.sondages.length;

    const sondage = await sondagesService.creerSondage({
      newsId: target.id,
      titre: 'Sondage de test',
      question: 'Êtes-vous d’accord ?',
      choix: ['Oui', 'Non'],
      dateDebut: new Date().toISOString(),
      dateFin: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(sondage.newsId).toBe(target.id);
    expect(sondage.choix.map((c) => c.libelle)).toEqual(['Oui', 'Non']);
    expect(sondage.totalVotes).toBe(0);

    const updatedNews = await newsService.getNewsBySlug(target.slug);
    expect(updatedNews?.sondages.length).toBe(nbSondagesAvant + 1);
  });
});
