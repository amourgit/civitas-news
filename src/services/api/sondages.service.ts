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
import type { SondageEcriturePayload } from './repositories/sondages.repository';

export const sondagesService = {
  creerSondage: async (payload: SondageEcriturePayload): Promise<Sondage> => {
    if (!env.useMockData) {
      return sondagesRepository.create(payload);
    }

    const newsList = await newsService.getNews();
    const newsItem = newsList.find((n) => n.id === payload.newsId || n.slug === payload.newsId);
    if (!newsItem) {
      throw new Error(`News introuvable pour la création du sondage : ${payload.newsId}`);
    }

    const sondage: Sondage = {
      id: `sondage-${Date.now()}`,
      newsId: newsItem.id,
      sujetId: newsItem.id,
      titre: payload.titre,
      description: payload.description,
      question: payload.question,
      choix: payload.choix.map((libelle, index) => ({
        id: `c${index + 1}-${Date.now()}`,
        libelle,
        nombreVotes: 0,
        pourcentage: 0,
      })),
      dateDebut: payload.dateDebut,
      dateFin: payload.dateFin,
      typeVote: payload.typeVote || 'unique',
      anonymat: payload.anonymat ?? true,
      visibiliteResultat: payload.visibiliteResultat || 'instantane',
      statut: payload.statut || 'actif',
      totalVotes: 0,
      userVotedChoiceIds: [],
    };

    // `newsItem` provient de newsMemory (même référence, copie superficielle
    // uniquement au niveau du tableau) — pousser ici met bien à jour l'état
    // partagé, comme le fait déjà voteSondage juste en dessous.
    newsItem.sondages.push(sondage);
    return sondage;
  },

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
