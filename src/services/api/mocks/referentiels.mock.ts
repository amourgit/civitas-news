// ============================================================
// src/services/api/mocks/referentiels.mock.ts
// Données de référence simulées (catégories éditoriales,
// organisations publiantes, établissements) — même forme que les
// serializers referentiels/api/v1/serializers.py côté backend.
// ============================================================

import type { Categorie, Organisation, Etablissement } from '../../../types/global.types';

export const MOCK_CATEGORIES: Categorie[] = [
  { id: 'cat-vie-academique', nom: 'Vie Académique', couleur: '#5B4DFF', icone: 'BookOpen' },
  { id: 'cat-innovation', nom: 'Innovation & IA Académique', couleur: '#7B61FF', icone: 'Sparkles' },
  { id: 'cat-sante', nom: 'Santé & Alimentation', couleur: '#34D399', icone: 'HeartPulse' },
  { id: 'cat-orientation', nom: 'Orientation & Carrière', couleur: '#F59E0B', icone: 'Compass' },
  { id: 'cat-gouvernance', nom: 'Gouvernance Académique', couleur: '#EF4444', icone: 'Landmark' },
  { id: 'cat-transport', nom: 'Vie Étudiante & Transports', couleur: '#0EA5E9', icone: 'Bus' },
];

export const MOCK_ORGANISATIONS: Organisation[] = [
  { id: 'org-civitas', nom: 'CIVITAS', type: 'association_etudiante', description: 'Association civique étudiante.' },
  { id: 'org-administration', nom: 'Administration Centrale', type: 'administration', description: 'Services administratifs.' },
  { id: 'org-club-robotique', nom: 'Club Robotique ENSET', type: 'club', description: 'Club technique étudiant.' },
];

export const MOCK_ETABLISSEMENTS: Etablissement[] = [
  { id: 'etab-une', nom: 'Université Numérique du Gabon', province: 'Estuaire' },
  { id: 'etab-enset', nom: 'ENSET Libreville', province: 'Estuaire' },
  { id: 'etab-usn', nom: 'Université des Sciences de la Santé', province: 'Estuaire' },
];
