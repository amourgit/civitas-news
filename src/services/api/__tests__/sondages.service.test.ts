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

  it('replaces the previous vote instead of accumulating on a single-choice poll', async () => {
    // sondage-104 : typeVote 'unique', non touché par les autres tests de
    // ce fichier -- baseline capturée en direct pour rester indépendante
    // de l'ordre d'exécution.
    const before = await sondagesService.voteSondage('sondage-104', []);
    const totalAvant = before!.totalVotes;
    const c1Avant = before!.choix.find((c) => c.id === 'c1')!.nombreVotes;
    const c2Avant = before!.choix.find((c) => c.id === 'c2')!.nombreVotes;

    const apresVoteC1 = await sondagesService.voteSondage('sondage-104', ['c1']);
    expect(apresVoteC1!.totalVotes).toBe(totalAvant + 1);
    expect(apresVoteC1!.choix.find((c) => c.id === 'c1')!.nombreVotes).toBe(c1Avant + 1);

    // Changement d'avis : c1 -> c2. Ne doit PAS accumuler les deux votes.
    const apresChangement = await sondagesService.voteSondage('sondage-104', ['c2']);
    expect(apresChangement!.totalVotes).toBe(totalAvant + 1); // toujours 1 votant, pas 2
    expect(apresChangement!.choix.find((c) => c.id === 'c1')!.nombreVotes).toBe(c1Avant);
    expect(apresChangement!.choix.find((c) => c.id === 'c2')!.nombreVotes).toBe(c2Avant + 1);
    expect(apresChangement!.userVotedChoiceIds).toEqual(['c2']);

    // Retrait complet du vote.
    const apresRetrait = await sondagesService.voteSondage('sondage-104', []);
    expect(apresRetrait!.totalVotes).toBe(totalAvant);
    expect(apresRetrait!.choix.find((c) => c.id === 'c2')!.nombreVotes).toBe(c2Avant);
    expect(apresRetrait!.userVotedChoiceIds).toEqual([]);
  });

  it('reconciles additions and removals on a multiple-choice poll without touching the voter count', async () => {
    // sondage-102 : typeVote 'multiple'.
    const before = await sondagesService.voteSondage('sondage-102', []);
    const totalAvant = before!.totalVotes;
    const c2Avant = before!.choix.find((c) => c.id === 'c2')!.nombreVotes;
    const c3Avant = before!.choix.find((c) => c.id === 'c3')!.nombreVotes;

    const apresSelection = await sondagesService.voteSondage('sondage-102', ['c1', 'c2']);
    expect(apresSelection!.totalVotes).toBe(totalAvant + 1);

    // Retire c2, garde c1, ajoute c3 -- un seul votant tout du long.
    const apresReconciliation = await sondagesService.voteSondage('sondage-102', ['c1', 'c3']);
    expect(apresReconciliation!.totalVotes).toBe(totalAvant + 1);
    expect(apresReconciliation!.choix.find((c) => c.id === 'c2')!.nombreVotes).toBe(c2Avant);
    expect(apresReconciliation!.choix.find((c) => c.id === 'c3')!.nombreVotes).toBe(c3Avant + 1);
    expect(apresReconciliation!.userVotedChoiceIds?.sort()).toEqual(['c1', 'c3']);
  });
});
