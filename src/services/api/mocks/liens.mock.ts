// ============================================================
// src/services/api/mocks/liens.mock.ts
// Données factices du domaine Liens de publication.
// ============================================================

import type { LienPublication } from '../../../types/global.types';

export const INITIAL_LIENS: LienPublication[] = [
  {
    id: 'lien-001',
    newsId: 'news-1',
    sujetId: 'news-1',
    urlPublique: 'https://civitasnews.org/news/reforme-transport-etudiant-2026',
    urlCourte: 'https://civit.as/tr-2026',
    visibilite: 'public',
    clics: 1420,
    scans: 380,
    createdAt: '2026-07-15T10:30:00Z',
  },
];
