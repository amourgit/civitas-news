// ============================================================
// src/features/meteo/types/meteo.types.ts
// La Météo n'est PAS un domaine du Backend-Core-Base (aucune route
// météo n'existe côté API) : cette feature est volontairement
// autonome et mockée de bout en bout (voir ../mocks/meteo.mock.ts),
// séparée du système réel/mock des autres domaines (news, sondages,
// statistiques...) piloté par `env.useMockData`.
//
// Le découpage type / mock / hook / composant reste identique aux
// autres features du projet afin qu'un futur branchement sur une
// vraie API météo (ex: OpenWeather) se limite à réécrire le contenu
// de `meteoService.getMeteoParProvinces`, sans toucher au hook ni au
// composant d'affichage.
// ============================================================

export type ConditionMeteo =
  | 'ensoleille'
  | 'partiellement_nuageux'
  | 'nuageux'
  | 'pluvieux'
  | 'orageux';

export interface MeteoProvince {
  /** Doit correspondre exactement à une valeur de PROVINCES_GABON (news/constants/newsFieldOptions.ts). */
  province: string;
  /** Ville de référence (chef-lieu) utilisée pour la mesure. */
  ville: string;
  temperatureC: number;
  temperatureRessentieC: number;
  condition: ConditionMeteo;
  humidite: number;
  ventKmh: number;
  precipitationMm: number;
  /** Horodatage ISO de la dernière "mesure" simulée. */
  mesureAt: string;
}
