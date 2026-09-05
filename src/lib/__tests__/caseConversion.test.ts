import { describe, it, expect } from 'vitest';
import { toCamelCaseDeep } from '../caseConversion';
import { StatistiquesGlobalesSchema } from '../../types/models/statistiques.types';

describe('toCamelCaseDeep', () => {
  it('convertit récursivement les clés snake_case (objets et tableaux imbriqués)', () => {
    const input = {
      total_visiteurs: 120,
      participation_par_province: [{ province: 'Estuaire', votes: 42, news: 3 }],
      deja_camel: { dejaOk: true, encore_snake: 1 },
    };
    expect(toCamelCaseDeep(input)).toEqual({
      totalVisiteurs: 120,
      participationParProvince: [{ province: 'Estuaire', votes: 42, news: 3 }],
      dejaCamel: { dejaOk: true, encoreSnake: 1 },
    });
  });

  it('ne modifie pas une réponse déjà en camelCase (idempotent)', () => {
    const input = { totalVisiteurs: 5, participationParProvince: [] };
    expect(toCamelCaseDeep(input)).toEqual(input);
  });
});

describe('StatistiquesGlobalesSchema + toCamelCaseDeep (scénario backend réel)', () => {
  it('valide une réponse Django typique en snake_case une fois normalisée', async () => {
    // Forme plausible d'une réponse construite à la main côté backend
    // (statistiques/api/v1/services.py), AVANT toute conversion de casse --
    // c'est exactement ce scénario qui faisait échouer la validation en
    // production (voir statistiques.repository.ts).
    const rawBackendResponse = {
      total_visiteurs: 15234,
      total_votes: 8421,
      total_commentaires: 2310,
      total_news_actives: 187,
      total_organisations: 12,
      croissance_mensuelle: 4.5,
      participation_par_province: [{ province: 'Estuaire', votes: 4210, news: 62 }],
      repartition_par_categorie: [{ category: 'Politique', count: 80, percentage: 42.8 }],
      activite_par_heure: [{ heure: '08h', votes: 120, commentaires: 30 }],
    };

    const normalized = toCamelCaseDeep(rawBackendResponse);
    const result = await StatistiquesGlobalesSchema.parseAsync(normalized);

    expect(result.totalVisiteurs).toBe(15234);
    expect(result.participationParProvince[0].province).toBe('Estuaire');
  });

  it('sans normalisation, une réponse snake_case dégrade à zéro/vide plutôt que de planter (les .catch() absorbent, mais perdent les vraies valeurs)', async () => {
    const rawBackendResponse = {
      total_visiteurs: 15234,
      total_votes: 8421,
      total_commentaires: 2310,
      total_news_actives: 187,
      total_organisations: 12,
      croissance_mensuelle: 4.5,
      participation_par_province: [{ province: 'Estuaire', votes: 4210, news: 62 }],
      repartition_par_categorie: [{ category: 'Politique', count: 80, percentage: 42.8 }],
      activite_par_heure: [{ heure: '08h', votes: 120, commentaires: 30 }],
    };

    // Ne rejette plus (les .catch() du schéma absorbent chaque champ manquant),
    // mais sans la normalisation de casse, les vraies valeurs sont perdues --
    // c'est bien la combinaison des deux correctifs qui restitue les données
    // réelles (voir le test précédent), le .catch() seul n'étant qu'un filet
    // de sécurité pour ne jamais afficher un dashboard totalement vide.
    const result = await StatistiquesGlobalesSchema.parseAsync(rawBackendResponse);
    expect(result.totalVisiteurs).toBe(0);
    expect(result.participationParProvince).toEqual([]);
  });
});
