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
  /**
   * Liste TOUS les sondages existants sur la plateforme, tous articles
   * confondus -- utilisée par la page dédiée /sondages (voir
   * SondagesListPage.tsx), qui affiche les sondages eux-mêmes
   * (SondageCard) et non plus une simple liste de News filtrée.
   * Mode réel : délégué à l'endpoint dédié `sondagesRepository.list()`.
   * Mode mock : les sondages n'ayant pas d'existence propre (voir
   * l'en-tête de ce fichier), on les retrouve en aplatissant le champ
   * `sondages` de chaque News de type 'sondage'.
   */
  listSondages: async (): Promise<Sondage[]> => {
    if (!env.useMockData) {
      return sondagesRepository.list();
    }
    const newsList = await newsService.getNews({ type: 'sondage' });
    return newsList.flatMap((n) => n.sondages ?? []);
  },

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

  /**
   * Remplace la sélection de l'utilisateur (comme le fait le backend réel
   * -- voir sondagesRepository.vote) : les choix retirés de `choixIds`
   * voient leur compteur décrémenté, pas seulement les nouveaux choix
   * incrémentés. `totalVotes` (votants distincts) ne bouge que quand
   * l'utilisateur simulé vote pour la toute première fois ou retire
   * entièrement son vote -- changer son choix ne change pas le nombre de
   * votants, seulement leur répartition.
   */
  voteSondage: async (sondageId: string, choixIds: string[]): Promise<Sondage | null> => {
    if (!env.useMockData) {
      return sondagesRepository.vote(sondageId, choixIds);
    }

    const newsList = await newsService.getNews();
    let updatedSondage: Sondage | null = null;

    newsList.forEach((newsItem) => {
      const sondageIndex = newsItem.sondages.findIndex((s) => s.id === sondageId);
      if (sondageIndex === -1) return;

      const sondage = newsItem.sondages[sondageIndex];
      const ancienIds = new Set(sondage.userVotedChoiceIds ?? []);
      const nouveauxIds = new Set(choixIds);

      const aVoteAvant = ancienIds.size > 0;
      const aVoteApres = nouveauxIds.size > 0;
      // +1 votant à la première sélection, -1 au retrait complet, 0 sinon
      // (l'utilisateur change juste de choix -- toujours 1 votant).
      const deltaVotants = aVoteApres && !aVoteAvant ? 1 : !aVoteApres && aVoteAvant ? -1 : 0;
      const newTotalVotes = Math.max(0, sondage.totalVotes + deltaVotants);

      const updatedChoix = sondage.choix.map((c) => {
        const etaitSelectionne = ancienIds.has(c.id);
        const estSelectionne = nouveauxIds.has(c.id);
        const delta = estSelectionne && !etaitSelectionne ? 1 : !estSelectionne && etaitSelectionne ? -1 : 0;
        return { ...c, nombreVotes: Math.max(0, c.nombreVotes + delta) };
      });
      updatedChoix.forEach((c) => {
        c.pourcentage = newTotalVotes === 0 ? 0 : parseFloat(((c.nombreVotes / newTotalVotes) * 100).toFixed(1));
      });

      updatedSondage = {
        ...sondage,
        totalVotes: newTotalVotes,
        choix: updatedChoix,
        userVotedChoiceIds: choixIds,
        resultatsVisibles: sondage.resultatsVisibles ?? true,
      };

      newsItem.sondages[sondageIndex] = updatedSondage;
      newsItem.stats.votes += deltaVotants;
    });

    return updatedSondage;
  },
};
