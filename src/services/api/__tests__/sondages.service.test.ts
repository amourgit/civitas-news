import { describe, it, expect } from 'vitest';
import { sondagesService } from '../sondages.service';

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
});
