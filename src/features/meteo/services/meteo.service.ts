// ============================================================
// src/features/meteo/services/meteo.service.ts
// Point d'entrée UNIQUE de la feature météo. Aujourd'hui il délègue
// au mock (voir ../mocks/meteo.mock.ts) car aucune route météo
// n'existe dans Backend-Core-Base. Le jour où un vrai fournisseur
// est branché, seule cette fonction change — hook et composant
// d'affichage n'ont pas à être modifiés.
// ============================================================

import { fetchMeteoParProvincesMock } from '../mocks/meteo.mock';
import type { MeteoProvince } from '../types/meteo.types';

export const meteoService = {
  getMeteoParProvinces: (): Promise<MeteoProvince[]> => fetchMeteoParProvincesMock(),
};
