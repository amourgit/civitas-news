export interface CivitasInfoMock {
  nom: string;
  slogan: string;
  description: string;
  localisation: {
    adresse: string;
    ville: string;
    pays: string;
    coordonnees: string;
    bureauPrincipal: string;
  };
  contact: {
    email: string;
    telephone: string;
    support: string;
    siteWeb: string;
    horaires: string;
  };
  mission: string;
  vision: string;
  positionnementIA: {
    titre: string;
    resume: string;
    pointsCles: string[];
  };
  piliers: Array<{
    id: string;
    titre: string;
    description: string;
    icon: string;
    badge: string;
  }>;
  objectifs2026: Array<{
    valeur: string;
    label: string;
    description: string;
  }>;
}

export const civitasInfoMockData: CivitasInfoMock = {
  nom: 'CIVITAS NEWS & INNOVATION',
  slogan: 'Le Médiateur Technologique entre l\'Intelligence Artificielle et les Défis Stratégiques Africains',
  description:
    'CIVITAS est l\'institution numérique de référence dédiée au rapprochement des technologies émergentes et des réalités institutionnelles, citoyennes et économiques du continent africain. Nous concevons et déployons des plateformes de gouvernance, d\'information vérifiée et de démocratie participative adaptées aux infrastructures et enjeux stratégiques locaux.',
  localisation: {
    adresse: 'Boulevard du 30 Juin, Immeuble de l\'Innovation, 4ème étage',
    ville: 'Kinshasa - Gombe',
    pays: 'République Démocratique du Congo',
    coordonnees: '4°18\'35.2"S 15°18\'12.5"E',
    bureauPrincipal: 'Siège Central Kinshasa & Hubs Régionaux (Goma, Lubumbashi, Kisangani)',
  },
  contact: {
    email: 'contact@civitas-news.cd',
    telephone: '+243 (0) 81 000 2026 / +243 (0) 99 100 4040',
    support: 'support@civitas-news.cd',
    siteWeb: 'https://civitas-news.cd',
    horaires: 'Lundi - Vendredi : 08h00 - 17h00 (WAT / UTC+1)',
  },
  mission:
    'Guider et réussir la transformation numérique souveraine en servant de médiateur informatique de confiance entre les solutions d\'intelligence artificielle de pointe et les contraintes stratégiques, territoriales et culturelles africaines.',
  vision:
    'Faire de l\'Afrique un pionnier de l\'IA citoyenne, éthique et inclusive, où chaque décision publique et chaque consultation populaire s\'appuient sur des données transparentes, vérifiées et directement accessibles à tous les citoyens.',
  positionnementIA: {
    titre: 'Médiateur Informatique & Intégrateur d\'IA Souveraine',
    resume:
      'Les avancées globales de l\'Intelligence Artificielle offrent des opportunités inédites. Néanmoins, leur adoption requiert une adaptation rigoureuse aux infrastructures réseau, aux langues locales, à la souveraineté des données et aux réalités réglementaires africaines.',
    pointsCles: [
      'Adaptation des modèles d\'IA aux contraintes de connectivité et accès offline/hybride',
      'Traduction et synthèse automatique multilingue (Français, Lingala, Swahili, Tshiluba, Kikongo)',
      'Algorithmes de détection de faux contenus (Fact-checking) sécurisés et transparents',
      'Respect strict des règles de souveraineté des données citoyennes et régionales',
    ],
  },
  piliers: [
    {
      id: 'ia-ethique',
      titre: 'Médiation IA & Souveraineté',
      description:
        'Intermédiaire technique garantissant l\'adéquation parfaite entre les architectures IA globales et le cadre réglementaire et stratégique africain.',
      icon: 'Cpu',
      badge: 'Cœur de Métier',
    },
    {
      id: 'democratie',
      titre: 'Consultations & Transparence',
      description:
        'Donner la parole aux citoyens à travers des sondages certifiés, des consultations budgétaires et un suivi d\'impact en temps réel.',
      icon: 'Vote',
      badge: 'Engagement',
    },
    {
      id: 'inclusion',
      titre: 'Inclusion & Accessibilité',
      description:
        'Interface fluide, universelle et optimisée pour tous les réseaux mobiles (3G/4G/5G) et équipements numériques des 26 provinces.',
      icon: 'Globe',
      badge: 'Territorial',
    },
    {
      id: 'securite',
      titre: 'Sécurité & Intégrité',
      description:
        'Protection maximale des données personnelles et traçabilité inviolable des contributions citoyennes.',
      icon: 'ShieldCheck',
      badge: 'Confiance',
    },
  ],
  objectifs2026: [
    {
      valeur: '26 / 26',
      label: 'Provinces Couvertes',
      description: 'Accès égalitaire aux informations et consultations nationales',
    },
    {
      valeur: '500k+',
      label: 'Citoyens Engagés',
      description: 'Participants actifs aux sondages et consultations d\'ici fin 2026',
    },
    {
      valeur: '< 200ms',
      label: 'Temps de Réponse IA',
      description: 'Moteur d\'analyse sémantique optimisé pour les réseaux locaux',
    },
    {
      valeur: '100%',
      label: 'Transparence Algorithmique',
      description: 'Audits ouverts et traçabilité certifiée de chaque vote citoyen',
    },
  ],
};
