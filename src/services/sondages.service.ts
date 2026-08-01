import { Sondage } from '../types/global.types';
import { newsService } from './news.service';

export const sondagesService = {
  voteSondage: async (sondageId: string, choixIds: string[]): Promise<Sondage | null> => {
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

        // recalculate percentages for all
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
