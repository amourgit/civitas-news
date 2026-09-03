// ============================================================
// src/features/meteo/mocks/meteo.mock.ts
// Source de données MOCK dédiée à la météo — intentionnellement
// séparée des mocks de `src/services/api/mocks/` (ceux-là simulent
// de vrais domaines backend et basculent vers l'API réelle via
// `env.useMockData`). Ici il n'existe pas d'équivalent réel : la
// météo restera mockée tant qu'aucun fournisseur n'est branché.
// ============================================================

import { PROVINCES_GABON } from '../../news/constants/newsFieldOptions';
import type { ConditionMeteo, MeteoProvince } from '../types/meteo.types';

/** Chef-lieu de chaque province (référence pour l'affichage). */
const CHEFS_LIEUX: Record<string, string> = {
  'Estuaire': 'Libreville',
  'Haut-Ogooué': 'Franceville',
  'Moyen-Ogooué': 'Lambaréné',
  'Ngounié': 'Mouila',
  'Nyanga': 'Tchibanga',
  'Ogooué-Ivindo': 'Makokou',
  'Ogooué-Lolo': 'Koulamoutou',
  'Ogooué-Maritime': 'Port-Gentil',
  'Woleu-Ntem': 'Oyem',
};

/** Provinces côtières : climat plus humide, davantage de pluie/orages. */
const PROVINCES_COTIERES = new Set(['Estuaire', 'Ogooué-Maritime', 'Nyanga', 'Moyen-Ogooué']);

const CONDITIONS_INTERIEUR: ConditionMeteo[] = [
  'ensoleille',
  'partiellement_nuageux',
  'partiellement_nuageux',
  'nuageux',
  'pluvieux',
];

const CONDITIONS_COTIERES: ConditionMeteo[] = [
  'partiellement_nuageux',
  'nuageux',
  'pluvieux',
  'pluvieux',
  'orageux',
];

function pickAleatoire<T>(liste: T[]): T {
  return liste[Math.floor(Math.random() * liste.length)];
}

/** Arrondi à une décimale, pour des valeurs qui restent lisibles côté carte. */
function arrondi(valeur: number, decimales = 0): number {
  const facteur = 10 ** decimales;
  return Math.round(valeur * facteur) / facteur;
}

function genererMeteoProvince(province: string): MeteoProvince {
  const cotiere = PROVINCES_COTIERES.has(province);
  const condition = pickAleatoire(cotiere ? CONDITIONS_COTIERES : CONDITIONS_INTERIEUR);

  // Climat équatorial gabonais : chaud et humide toute l'année, base
  // 24-32°C, légèrement plus frais et instable sur les provinces
  // intérieures d'altitude (Haut-Ogooué, Ogooué-Lolo).
  const baseTemp = cotiere ? 27 : 25;
  const variationTemp = cotiere ? 4 : 6;
  const temperatureC = arrondi(baseTemp + (Math.random() * variationTemp - variationTemp / 2), 0);

  const ecartRessenti = condition === 'orageux' || condition === 'pluvieux' ? -1 : 2;
  const temperatureRessentieC = arrondi(temperatureC + ecartRessenti + Math.random(), 0);

  const humiditeBase = cotiere ? 82 : 72;
  const humidite = Math.min(98, arrondi(humiditeBase + Math.random() * 14));

  const ventKmh = arrondi(
    condition === 'orageux' ? 18 + Math.random() * 20 : 6 + Math.random() * 14
  );

  const precipitationMm =
    condition === 'orageux'
      ? arrondi(12 + Math.random() * 30, 1)
      : condition === 'pluvieux'
      ? arrondi(2 + Math.random() * 10, 1)
      : 0;

  return {
    province,
    ville: CHEFS_LIEUX[province] ?? province,
    temperatureC,
    temperatureRessentieC,
    condition,
    humidite,
    ventKmh,
    precipitationMm,
    mesureAt: new Date().toISOString(),
  };
}

/**
 * Simule un appel réseau (latence + données fraîches à chaque appel) afin
 * que la section se comporte exactement comme les autres hooks du projet
 * (isLoading, données qui varient réellement dans le temps), en attendant
 * un éventuel branchement sur un vrai fournisseur météo.
 */
export function fetchMeteoParProvincesMock(): Promise<MeteoProvince[]> {
  return new Promise((resolve) => {
    const latenceMs = 450 + Math.random() * 400;
    setTimeout(() => {
      resolve(PROVINCES_GABON.map((province) => genererMeteoProvince(province)));
    }, latenceMs);
  });
}
