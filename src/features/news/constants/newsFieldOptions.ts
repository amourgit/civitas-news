// ============================================================
// src/features/news/constants/newsFieldOptions.ts
// Options « en dur » des champs News qui sont des choices Django
// simples (pas de table de référence) — miroir EXACT de
// Backend-Core-Base news/models.py : NewsType.choices et
// Province.choices. Toute évolution de ces choices côté backend doit
// être répercutée ici à la main (pas de table à interroger pour ces
// deux champs, contrairement à catégorie/organisation/établissement —
// voir features/news/hooks/useReferentiels.ts pour celles-ci).
//
// Point d'entrée UNIQUE pour ces deux listes : les composants de
// filtre (NewsFiltres) et le formulaire de création (CreerNewsPage)
// doivent importer depuis ici plutôt que redéfinir leur propre
// sous-ensemble, pour rester exhaustifs et cohérents avec le modèle.
// ============================================================

import type { NewsType } from '../../../types/global.types';

export interface NewsFieldOption<T extends string> {
  value: T;
  label: string;
}

/** Les 16 formats de News (news/models.py: NewsType), dans l'ordre du backend. */
export const NEWS_TYPE_OPTIONS: NewsFieldOption<NewsType>[] = [
  { value: 'projet', label: 'Projet' },
  { value: 'evenement', label: 'Événement' },
  { value: 'annonce', label: 'Annonce' },
  { value: 'sondage', label: 'Sondage' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'petition', label: 'Pétition' },
  { value: 'information', label: 'Information' },
  { value: 'reforme', label: 'Réforme' },
  { value: 'idee', label: 'Idée' },
  { value: 'conference', label: 'Conférence' },
  { value: 'reunion', label: 'Réunion' },
  { value: 'atelier', label: 'Atelier' },
  { value: 'appel_participation', label: 'Appel à participation' },
  { value: 'article', label: 'Article' },
  { value: 'publication', label: 'Publication' },
  { value: 'actualite', label: 'Actualité' },
];

/** Les 9 provinces du Gabon (news/models.py: Province) — liste fixe, ne justifie pas une table de référence dédiée côté backend. */
export const PROVINCES_GABON: string[] = [
  'Estuaire',
  'Haut-Ogooué',
  'Moyen-Ogooué',
  'Ngounié',
  'Nyanga',
  'Ogooué-Ivindo',
  'Ogooué-Lolo',
  'Ogooué-Maritime',
  'Woleu-Ntem',
];
