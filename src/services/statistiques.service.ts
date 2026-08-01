export interface StatistiquesGlobales {
  totalVisiteurs: number;
  totalVotes: number;
  totalCommentaires: number;
  totalNewsActives: number;
  totalSujetsActifs?: number;
  totalOrganisations: number;
  croissanceMensuelle: number;
  participationParProvince: Array<{ province: string; votes: number; news: number; sujets?: number }>;
  repartitionParCategorie: Array<{ category: string; count: number; percentage: number }>;
  activiteParHeure: Array<{ heure: string; votes: number; commentaires: number }>;
}

export const statistiquesService = {
  getStatistiquesGlobales: async (): Promise<StatistiquesGlobales> => {
    return {
      totalVisiteurs: 142500,
      totalVotes: 38940,
      totalCommentaires: 12480,
      totalNewsActives: 86,
      totalSujetsActifs: 86,
      totalOrganisations: 34,
      croissanceMensuelle: 24.5,
      participationParProvince: [
        { province: 'Kinshasa', votes: 14200, news: 32, sujets: 32 },
        { province: 'Haut-Katanga', votes: 8900, news: 18, sujets: 18 },
        { province: 'Nord-Kivu', votes: 6400, news: 14, sujets: 14 },
        { province: 'Kongo-Central', votes: 4800, news: 11, sujets: 11 },
        { province: 'Sud-Kivu', votes: 3100, news: 8, sujets: 8 },
        { province: 'Tshopo', votes: 1540, news: 3, sujets: 3 },
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
    };
  },
};
