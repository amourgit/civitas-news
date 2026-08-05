// ============================================================
// src/services/api/sondages.service.ts
// Service Sondages — bascule automatique mock/réel selon
// `env.useMockData`. En mode mock, les sondages vivent imbriqués
// dans les News (voir news.service.ts) et sont mutés en place ;
// en mode réel, le vote est délégué directement au backend via
// sondagesRepository.
// ============================================================

import { env } from '../../config/env';
import type { Sondage } from '../../types/global.types';
import { newsService } from './news.service';
import { sondagesRepository } from './repositories/sondages.repository';

export const sondagesService = {
  voteSondage: async (sondageId: string, choixIds: string[]): Promise<Sondage | null> => {
    if (!env.useMockData) {
      return sondagesRepository.vote(sondageId, choixIds);
    }

    const newsList = await newsService.getNews();
    let updatedSondage: Sondage | null = null;

    newsList.forEach((newsItem) => {
      const sondageIndex = newsItem.sondages.findIndex((s) => s.id === sondageId);
      if (sondageIndex !== -1) {
        const sondage = newsItem.sondages[sondageIndex];
        const newTotalVotes = sondage.totalVotes + 1;

        const updatedChoix = sondage.choix.map((c) => {
          const isSelected = choixIds.includes(c.id);
          const newVotes = isSelected ? c.nombreVotes + 1 : c.nombreVotes;
          return {
            ...c,
            nombreVotes: newVotes,
            pourcentage: parseFloat(((newVotes / newTotalVotes) * 100).toFixed(1)),
          };
        });

        // recalcule les pourcentages pour tous les choix
        updatedChoix.forEach((c) => {
          c.pourcentage = parseFloat(((c.nombreVotes / newTotalVotes) * 100).toFixed(1));
        });

        updatedSondage = {
          ...sondage,
          totalVotes: newTotalVotes,
          choix: updatedChoix,
          userVotedChoiceIds: choixIds,
        };

        newsItem.sondages[sondageIndex] = updatedSondage;
        newsItem.stats.votes += 1;
      }
    });

    return updatedSondage;
  },
};
