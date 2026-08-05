// ============================================================
// src/services/api/mocks/statistiques.mock.ts
// Données factices du domaine Statistiques globales.
// ============================================================

import type { StatistiquesGlobales } from '../../../types/global.types';

export const MOCK_STATISTIQUES_GLOBALES: StatistiquesGlobales = {
      totalVisiteurs: 142500,
      totalVotes: 38940,
      totalCommentaires: 12480,
      totalNewsActives: 86,
      totalSujetsActifs: 86,
      totalOrganisations: 34,
      totalCitoyensInscrits: 18420,
      croissanceMensuelle: 24.5,
      // Provinces du Gabon (cohérent avec BentoBarProvinces et la mention
      // "9 provinces et la diaspora" de StatistiquesPage.tsx).
      participationParProvince: [
        { province: 'Estuaire', votes: 14200, news: 32, sujets: 32, commentaires: 6100 },
        { province: 'Haut-Ogooué', votes: 8900, news: 18, sujets: 18, commentaires: 3400 },
        { province: 'Woleu-Ntem', votes: 6400, news: 14, sujets: 14, commentaires: 2500 },
        { province: 'Ogooué-Maritime', votes: 4800, news: 11, sujets: 11, commentaires: 1900 },
        { province: 'Ngounié', votes: 3100, news: 8, sujets: 8, commentaires: 1200 },
        { province: 'Nyanga', votes: 2400, news: 6, sujets: 6, commentaires: 940 },
        { province: 'Ogooué-Ivindo', votes: 1900, news: 5, sujets: 5, commentaires: 780 },
        { province: 'Moyen-Ogooué', votes: 1540, news: 3, sujets: 3, commentaires: 610 },
        { province: 'Ogooué-Lolo', votes: 1200, news: 3, sujets: 3, commentaires: 480 },
      ],
      repartitionParCategorie: [
        { category: 'Vie Étudiante & Transports', count: 28, percentage: 32.5 },
        { category: 'Innovation & IA Académique', count: 22, percentage: 25.6 },
        { category: 'Santé & Alimentation', count: 18, percentage: 20.9 },
        { category: 'Orientation & Carrière', count: 12, percentage: 14.0 },
        { category: 'Gouvernance Académique', count: 6, percentage: 7.0 },
      ],
      activiteParHeure: [
        { heure: '08h', votes: 120, commentaires: 45 },
        { heure: '10h', votes: 450, commentaires: 180 },
        { heure: '12h', votes: 890, commentaires: 340 },
        { heure: '14h', votes: 760, commentaires: 290 },
        { heure: '16h', votes: 1120, commentaires: 410 },
        { heure: '18h', votes: 940, commentaires: 360 },
        { heure: '20h', votes: 680, commentaires: 220 },
        { heure: '22h', votes: 310, commentaires: 95 },
      ],
      evolutionMensuelle: [
        { mois: 'Jan', participation: 12400 },
        { mois: 'Fév', participation: 18600 },
        { mois: 'Mar', participation: 24100 },
        { mois: 'Avr', participation: 21500 },
        { mois: 'Mai', participation: 32800 },
        { mois: 'Juin', participation: 41200 },
        { mois: 'Juil', participation: 56900 },
        { mois: 'Août', participation: 64500 },
      ],
      statutsConsultations: [
        { statut: 'adoptee', label: 'Adoptées par Décret', pourcentage: 68, compteur: 843, couleur: '#34D399' },
        { statut: 'analyse', label: "En cours d'Analyse", pourcentage: 24, compteur: 298, couleur: '#5B4DFF' },
        { statut: 'attente', label: 'En Attente de Quorum', pourcentage: 8, compteur: 99, couleur: '#F59E0B' },
      ],
      parite: {
        scoreRepresentativite: 92,
        hommesPct: 49,
        femmesPct: 51,
        tranche1835Pct: 64,
      },
};
