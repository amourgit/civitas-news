import { News, NewsType, TypeReaction, Sujet, SujetType } from '../types/global.types';
import { apiClient } from './api.client';

export const INITIAL_NEWS: News[] = [
  {
    id: 'news-1',
    slug: 'reforme-transport-etudiant-2026',
    type: 'consultation',
    titre: 'Réforme du Transport Étudiant 2026 : Gratuité des Transports et Lignes Express Campus',
    description: 'Consultation nationale sur le plan de modernisation des navettes académiques et la prise en charge à 100% pour les étudiants boursiers.',
    contenu: `### Contexte & Objectifs de la Consultation

La sous-commission nationale des transports universitaires soumet au débat public le **Plan Transport Éco-Étudiant 2026-2028**, élaboré à partir d'analyses citoyennes et de propositions issues de groupes de travail.

Face à l'augmentation des coûts de déplacement pour rejoindre les campus et les centres universitaires régionaux, cette consultation vise à recueillir les *avis*, **priorités** et propositions de la communauté étudiante.

#### 📊 Comparatif Budgétaire Proposé

| Mesure Prioritaire | Budget Alloué | Province Pilote | Impact Estimé |
| --- | --- | --- | --- |
| **Pass Mobilité Unique (PMUU)** | 14,5M $ | Kinshasa | 45 000 étudiants boursiers |
| **Lignes Directes Express** | 8,2M $ | Haut-Katanga | -25 min sur les trajets |
| **Flotte Vélos Électriques** | 3,1M $ | Nord-Kivu | 50 stations sécurisées |

#### 🎯 Axes Principaux Proposés :
1. **Pass Mobilité Universitaire Unique (PMUU)** : Tarif unique réduit ou gratuité totale pour les boursiers sur l'ensemble du réseau bus, tramway et TER provincial.
2. **Création de Lignes Directes Inter-Campus** : Connexion directe sans correspondance entre les résidences étudiantes principales et les facultés scientifiques et médicales.
3. **Flotte de Vélos Électriques en Libre-Service** : Installation de 50 stations de vélos sécurisés à accès par carte d'étudiant avec badge \`RFID-CIVITAS\`.

> *"Votre avis compte directement pour l'arbitrage du budget transports qui sera présenté lors de la prochaine session académique en plénière."* — **Commission Nationale**`,
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
    auteur: {
      id: 'usr-org-01',
      username: 'mutuelle_nationale',
      nomAffiche: 'Confédération des Mutuelles Étudiantes',
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      role: 'organisation',
      badges: [{ id: 'b1', nom: 'Organisation Agrée', icone: '🏛️', description: 'Représentant étudiant officiel' }],
      stats: { contributions: 45, votes: 120, commentaires: 88 },
    },
    organisation: {
      id: 'org-1',
      nom: 'Confédération des Mutuelles Étudiantes',
      logo: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&auto=format&fit=crop&q=80',
      type: 'Mutuelle Nationale',
    },
    etablissement: { id: 'etab-1', nom: 'Université Centrale & Réseau National', province: 'Kinshasa' },
    categorie: { id: 'cat-transports', nom: 'Transports & Mobilité', couleur: '#5B4DFF', icone: 'Bus' },
    tags: ['Transports', 'Bourses', 'Campus', 'Mobilité', 'Consultation2026'],
    province: 'Kinshasa',
    lieu: 'Grand Amphithéâtre & En Ligne',
    dateDebut: '2026-07-01T08:00:00Z',
    dateFin: '2026-08-31T23:59:59Z',
    createdAt: '2026-07-15T10:30:00Z',
    updatedAt: '2026-07-28T14:20:00Z',
    statut: 'publie',
    visibilite: 'public',
    stats: {
      vues: 4520,
      commentaires: 142,
      reactions: { coeur: 320, jaime: 512, bravo: 198, youpi: 45, wow: 38, jaimepas: 12 },
      votes: 1890,
      partages: 310,
    },
    sondages: [
      {
        id: 'sondage-101',
        newsId: 'news-1',
        sujetId: 'news-1',
        titre: 'Priorité d\'investissement Transports',
        question: 'Quelle doit être la priorité budgétaire absolue pour la rentrée 2026 ?',
        typeVote: 'unique',
        anonymat: true,
        visibiliteResultat: 'instantane',
        statut: 'actif',
        dateDebut: '2026-07-01T00:00:00Z',
        dateFin: '2026-08-31T23:59:59Z',
        totalVotes: 1890,
        choix: [
          { id: 'c1', libelle: 'Gratuité totale pour tous les étudiants boursiers', nombreVotes: 980, pourcentage: 51.8 },
          { id: 'c2', libelle: 'Augmentation de la fréquence des navettes inter-campus', nombreVotes: 510, pourcentage: 27.0 },
          { id: 'c3', libelle: 'Déploiement de vélos et trottinettes électriques gratuites', nombreVotes: 260, pourcentage: 13.8 },
          { id: 'c4', libelle: 'Lignes nocturnes jusqu’à 1h du matin en fin de semaine', nombreVotes: 140, pourcentage: 7.4 },
        ],
      },
    ],
    documents: [
      { id: 'doc-1', nom: 'Rapport_Complet_Transport_Etudiant_2026.pdf', url: '#', taille: 2450000, type: 'pdf' },
      { id: 'doc-2', nom: 'Synthese_Propositions_Mutuelle.pdf', url: '#', taille: 850000, type: 'pdf' },
    ],
    medias: [
      {
        id: 'med-s1-1',
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-group-of-friends-partying-happily-4640-large.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1000&auto=format&fit=crop&q=80',
        titre: 'Santorini & Perspectives de Mobilité — Film officiel',
        description: 'Reportage vidéo en immersion sur les enjeux de transport urbain et inter-universités.',
        duree: '02:45',
        vues: 4520,
        date: 'Juillet 2026',
      },
      {
        id: 'med-s1-2',
        type: 'youtube',
        url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        thumbnail: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
        titre: 'Débat et Parole Citoyenne : Pourquoi réformer maintenant ?',
        description: 'Explication en vidéo des objectifs et du calendrier des consultations publiques.',
        duree: '14:20',
        vues: 8900,
        date: 'Juillet 2026',
      },
      {
        id: 'med-s1-3',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1000&auto=format&fit=crop&q=80',
        titre: 'Explore — Cartographie du réseau de bus',
        description: 'Vue d\'ensemble des tracés prévus pour les navettes à haut niveau de service.',
        vues: 1250,
        date: 'Juin 2026',
      },
      {
        id: 'med-s1-4',
        type: 'video',
        url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-11-large.mp4',
        thumbnail: 'https://images.unsplash.com/photo-1477959858617-67f30bc4fc39?w=800&auto=format&fit=crop&q=80',
        titre: 'Stay — Vie nocturne et lignes express sur les campus',
        description: 'Perspectives sur les horaires de nuit et la sécurité aux abords des stations.',
        duree: '01:30',
        vues: 3100,
        date: 'Juillet 2026',
      },
      {
        id: 'med-s1-5',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&auto=format&fit=crop&q=80',
        titre: 'Cuisine — Éco-mobilité et restauration universitaire',
        description: 'Liaisons entre les résidences étudiantes et les centres d\'activités académiques.',
        vues: 2480,
        date: 'Juillet 2026',
      },
    ],
    lienPublication: {
      id: 'lien-1',
      newsId: 'news-1',
      sujetId: 'news-1',
      urlPublique: 'https://civitasnews.org/news/reforme-transport-etudiant-2026',
      urlCourte: 'https://civit.as/tr-2026',
      visibilite: 'public',
      clics: 4520,
      scans: 890,
      createdAt: '2026-07-15T10:30:00Z',
    },
  },
  {
    id: 'news-2',
    slug: 'consultation-plan-numerique-campus',
    type: 'projet',
    titre: 'Déploiement du Plan IA & Campus Connecté : WiFi Haute Vitesse et Serveurs de Calcul',
    description: 'Appel à projets et concertation pour équiper chaque amphi en bornes WiFi 7, espaces de coworking IA et accès libre aux licences logicielles de recherche.',
    contenu: `### Modernisation des Infrastructures Numériques Académiques

Le Conseil Pédagogique et Technologique présente le **Plan Campus Connecté 2026**.

#### Équipements prévus :
- **Couverture WiFi 7 intégrale** de 100% des salles de cours et bibliothèques.
- **Accès gratuit aux Clusters de Calcul GPU** pour les étudiants en Master et Doctorat.
- **Plateforme Unique d'Assistance IA** hébergée localement et respectueuse de la souveraineté des données.`,
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&auto=format&fit=crop&q=80',
    auteur: {
      id: 'usr-admin-01',
      username: 'prof_moussa',
      nomAffiche: 'Prof. Moussa Diop',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'administrateur',
      badges: [{ id: 'b2', nom: 'Doyen des Sciences', icone: '🎓', description: 'Administrateur académique' }],
      stats: { contributions: 68, votes: 95, commentaires: 150 },
    },
    etablissement: { id: 'etab-2', nom: 'Faculté Polytechnique & Sciences', province: 'Haut-Katanga' },
    categorie: { id: 'cat-numerique', nom: 'Innovation & IA', couleur: '#7B61FF', icone: 'Cpu' },
    tags: ['Numérique', 'WiFi7', 'IntelligenceArtificielle', 'Polytech', 'Matériel'],
    province: 'Haut-Katanga',
    lieu: 'Amphi Sciences II',
    dateDebut: '2026-07-10T09:00:00Z',
    dateFin: '2026-09-15T18:00:00Z',
    createdAt: '2026-07-10T09:00:00Z',
    updatedAt: '2026-07-29T11:00:00Z',
    statut: 'publie',
    visibilite: 'public',
    stats: {
      vues: 3210,
      commentaires: 89,
      reactions: { coeur: 210, jaime: 430, bravo: 310, youpi: 88, wow: 64, jaimepas: 5 },
      votes: 1240,
      partages: 180,
    },
    sondages: [
      {
        id: 'sondage-102',
        newsId: 'news-2',
        sujetId: 'news-2',
        titre: 'Service Numérique prioritaire',
        question: 'Quel outil logiciel ou matériel vous manque le plus au quotidien ?',
        typeVote: 'multiple',
        anonymat: true,
        visibiliteResultat: 'instantane',
        statut: 'actif',
        dateDebut: '2026-07-10T09:00:00Z',
        dateFin: '2026-09-15T18:00:00Z',
        totalVotes: 1240,
        choix: [
          { id: 'c1', libelle: 'Prises électriques et ports USB-C sur chaque bureau d\'amphi', nombreVotes: 780, pourcentage: 62.9 },
          { id: 'c2', libelle: 'Serveurs GPU de calcul haute performance pour la recherche', nombreVotes: 420, pourcentage: 33.8 },
          { id: 'c3', libelle: 'Accès illimité aux bases d\'articles scientifiques internationales', nombreVotes: 610, pourcentage: 49.1 },
        ],
      },
    ],
  },
  {
    id: 'news-3',
    slug: 'forum-national-orientation-metiers-2026',
    type: 'evenement',
    titre: 'Grand Forum National de l’Orientation & de l’Emploi Étudiant',
    description: 'Rencontre annuelle entre 150 entreprises, startups technologiques, laboratoires de recherche et 20 000 étudiants en recherche de stage et 1er emploi.',
    contenu: `Le Forum National de l'Emploi Étudiant se tiendra en format hybride (Présentiel au Palais des Congrès + Stands Virtuels 3D).

#### Programme des Journées :
- **Ateliers CV & Simulation d'entretiens** avec des DRH d'entreprises internationales.
- **Concours Pitch Startup Étudiante** : 50 000 $ de prix d'amorçage.
- **Hackathon IA & Impact Citoyen** (48 heures chrono).`,
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
    auteur: {
      id: 'usr-student-01',
      username: 'association_avenir',
      nomAffiche: 'Association Avenir Jeunesse',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'organisation',
      badges: [{ id: 'b3', nom: 'Partenaire Événements', icone: '🎯', description: 'Organisateur certifié' }],
      stats: { contributions: 30, votes: 90, commentaires: 45 },
    },
    etablissement: { id: 'etab-3', nom: 'Palais des Expositions & Campus Universitaires', province: 'Nord-Kivu' },
    categorie: { id: 'cat-emploi', nom: 'Carrière & Emploi', couleur: '#16A34A', icone: 'Briefcase' },
    tags: ['Emploi', 'Stages', 'Forum2026', 'Hackathon', 'Recrutement'],
    province: 'Nord-Kivu',
    lieu: 'Palais des Congrès & En Ligne',
    dateDebut: '2026-09-20T08:00:00Z',
    dateFin: '2026-09-22T20:00:00Z',
    createdAt: '2026-07-20T12:00:00Z',
    updatedAt: '2026-07-25T16:00:00Z',
    statut: 'publie',
    visibilite: 'public',
    stats: {
      vues: 5120,
      commentaires: 64,
      reactions: { coeur: 410, jaime: 620, bravo: 380, youpi: 120, wow: 95, jaimepas: 2 },
      votes: 890,
      partages: 450,
    },
    sondages: [],
  },
  {
    id: 'news-4',
    slug: 'petition-restauration-universitaire-qualite',
    type: 'petition',
    titre: 'Pétition Nationale : Pour des Restaurants Universitaires Équilibrés à Tarif Unique 1$',
    description: 'Pétition citoyenne portée par les amicales d’étudiants pour garantir 3 repas complets et nutritifs par jour dans tous les restos U du pays.',
    contenu: `Nous demandons solennellement au Ministère de l'Enseignement Supérieur :
1. La réhabilitation immédiate des cuisines et réfectoires des campus régionaux.
2. Le plafonnement du ticket repas à 1$ (ou équivalent local) pour l'ensemble des étudiants réguliers.
3. L'intégration de produits frais et locaux issus de l'agriculture biologique régionale.`,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
    auteur: {
      id: 'usr-student-02',
      username: 'samuel_n',
      nomAffiche: 'Samuel N. (Délégué Général)',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      role: 'etudiant',
      badges: [{ id: 'b4', nom: 'Délégué Élu', icone: '📢', description: 'Porteur de revendication' }],
      stats: { contributions: 22, votes: 140, commentaires: 110 },
    },
    etablissement: { id: 'etab-4', nom: 'Réseau National des Restaurants Universitaires', province: 'Kongo-Central' },
    categorie: { id: 'cat-sante', nom: 'Alimentation & Santé', couleur: '#F59E0B', icone: 'Utensils' },
    tags: ['RestoU', 'Alimentation', 'Pétition', 'Santé', 'Budget'],
    province: 'Kongo-Central',
    createdAt: '2026-07-18T15:00:00Z',
    updatedAt: '2026-07-30T09:30:00Z',
    statut: 'publie',
    visibilite: 'public',
    stats: {
      vues: 7890,
      commentaires: 210,
      reactions: { coeur: 950, jaime: 1200, bravo: 890, youpi: 340, wow: 110, jaimepas: 14 },
      votes: 4520,
      partages: 980,
    },
    sondages: [
      {
        id: 'sondage-104',
        newsId: 'news-4',
        sujetId: 'news-4',
        titre: 'Soutien à la Pétition Resto U',
        question: 'Appuyez-vous le plafonnement du ticket repas à 1$ et la rénovation des cantines ?',
        typeVote: 'unique',
        anonymat: true,
        visibiliteResultat: 'instantane',
        statut: 'actif',
        dateDebut: '2026-07-18T00:00:00Z',
        dateFin: '2026-10-31T23:59:59Z',
        totalVotes: 4520,
        choix: [
          { id: 'c1', libelle: 'Oui, je signe et soutiens pleinement la demande', nombreVotes: 4280, pourcentage: 94.7 },
          { id: 'c2', libelle: 'Neutre / Autre priorité budgétaire', nombreVotes: 180, pourcentage: 4.0 },
          { id: 'c3', libelle: 'Non', nombreVotes: 60, pourcentage: 1.3 },
        ],
      },
    ],
  },
  {
    id: 'news-5',
    slug: 'sondage-intelligence-artificielle-ethique-universite',
    type: 'sondage',
    titre: 'Sondage Étudiant : Usage de l’IA Générative dans les Travaux Académiques',
    description: 'Donnez votre avis sur le cadre éthique et la charte d’utilisation de ChatGPT et Gemini dans la rédaction des mémoires et évaluations.',
    contenu: `### Enquête Nationale sur l'Intelligence Artificielle à l'Université

Le Ministère de l'Enseignement Supérieur sollicite les étudiants pour élaborer la première **Charte Citoyenne de l'IA Académique**.

#### Questions clés abordées :
1. Faut-il autoriser l'IA comme outil d'assistance à la recherche documentée ?
2. Quelle transparence exiger dans la mention des sources générées par l'IA ?`,
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    auteur: {
      id: 'usr-admin-01',
      username: 'prof_moussa',
      nomAffiche: 'Prof. Moussa Diop',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'administrateur',
      badges: [{ id: 'b2', nom: 'Doyen des Sciences', icone: '🎓', description: 'Administrateur académique' }],
      stats: { contributions: 68, votes: 95, commentaires: 150 },
    },
    etablissement: { id: 'etab-2', nom: 'Faculté Polytechnique & Sciences', province: 'Haut-Katanga' },
    categorie: { id: 'cat-numerique', nom: 'Innovation & IA', couleur: '#7B61FF', icone: 'Cpu' },
    tags: ['Sondage', 'IA', 'Éthique', 'Étudiants', 'Pédagogie'],
    province: 'Kinshasa',
    createdAt: '2026-07-22T09:00:00Z',
    updatedAt: '2026-07-31T14:00:00Z',
    statut: 'publie',
    visibilite: 'public',
    stats: {
      vues: 3410,
      commentaires: 95,
      reactions: { coeur: 540, jaime: 780, bravo: 210, youpi: 90, wow: 110, jaimepas: 8 },
      votes: 1950,
      partages: 320,
    },
    sondages: [
      {
        id: 'sondage-105',
        newsId: 'news-5',
        sujetId: 'news-5',
        titre: 'Autorisation de l\'IA aux examens',
        question: 'Pensez-vous que l\'utilisation des assistants IA doit être encadrée ou librement autorisée ?',
        typeVote: 'unique',
        anonymat: true,
        visibiliteResultat: 'instantane',
        statut: 'actif',
        dateDebut: '2026-07-22T00:00:00Z',
        dateFin: '2026-09-30T23:59:59Z',
        totalVotes: 1950,
        choix: [
          { id: 'c1', libelle: 'Encadrée par une charte éthique claire', nombreVotes: 1250, pourcentage: 64.1 },
          { id: 'c2', libelle: 'Librement autorisée sans restriction', nombreVotes: 510, pourcentage: 26.2 },
          { id: 'c3', libelle: 'Strictement interdite pour les devoirs notés', nombreVotes: 190, pourcentage: 9.7 },
        ],
      },
    ],
  },
  {
    id: 'news-6',
    slug: 'annonce-lancement-bourses-excellence-2026',
    type: 'annonce',
    titre: 'Annonce Officielle : Ouverture des Candidatures aux Bourses d’Excellence 2026-2027',
    description: 'Publication des critères d’éligibilité, pièces à fournir et calendrier de dépôt pour les 5 000 nouvelles bourses d’études supérieures.',
    contenu: `### Lancement de la Campagne de Bourses d'Excellence 2026

La Direction Générale des Bourses et Prêts Étudiants informe l'ensemble des étudiants de l'ouverture du guichet unique de dépôt des dossiers.

#### Conditions générales :
- Être inscrit régulièrement dans un établissement supérieur agréé.
- Avoir validé son année précédente avec au moins 70% de réussite.
- Dépôt exclusivement en ligne via la plateforme CIVITAS.`,
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
    auteur: {
      id: 'usr-org-01',
      username: 'mutuelle_nationale',
      nomAffiche: 'Confédération des Mutuelles Étudiantes',
      avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      role: 'organisation',
      badges: [{ id: 'b1', nom: 'Organisation Agrée', icone: '🏛️', description: 'Représentant étudiant officiel' }],
      stats: { contributions: 45, votes: 120, commentaires: 88 },
    },
    etablissement: { id: 'etab-1', nom: 'Université Centrale & Réseau National', province: 'Kinshasa' },
    categorie: { id: 'cat-emploi', nom: 'Carrière & Emploi', couleur: '#16A34A', icone: 'Briefcase' },
    tags: ['Bourses', 'Annonce', 'Excellence', 'Inscription', 'Finances'],
    province: 'Kinshasa',
    createdAt: '2026-07-28T08:00:00Z',
    updatedAt: '2026-07-31T10:00:00Z',
    statut: 'publie',
    visibilite: 'public',
    stats: {
      vues: 6120,
      commentaires: 115,
      reactions: { coeur: 720, jaime: 910, bravo: 650, youpi: 240, wow: 180, jaimepas: 3 },
      votes: 0,
      partages: 510,
    },
    sondages: [],
  },
];

export const INITIAL_SUJETS = INITIAL_NEWS;

let newsMemory: News[] = INITIAL_NEWS;

export const newsService = {
  getNews: async (params?: { category?: string; type?: NewsType; search?: string; province?: string }): Promise<News[]> => {
    let list = [...newsMemory];
    if (params?.type) {
      list = list.filter((s) => s.type === params.type);
    }
    if (params?.category && params.category !== 'all') {
      list = list.filter((s) => s.categorie.id === params.category || s.categorie.nom.toLowerCase().includes(params.category.toLowerCase()));
    }
    if (params?.province && params.province !== 'all') {
      list = list.filter((s) => s.province === params.province);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.titre.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  },

  getNewsSync: (): News[] => {
    return newsMemory;
  },

  getNewsList: async (params?: { category?: string; type?: NewsType; search?: string; province?: string }): Promise<News[]> => {
    return newsService.getNews(params);
  },

  getSujets: async (params?: { category?: string; type?: NewsType; search?: string; province?: string }): Promise<News[]> => {
    return newsService.getNews(params);
  },

  getNewsBySlug: async (slug: string): Promise<News | null> => {
    const found = newsMemory.find((s) => s.slug === slug || s.id === slug);
    return found || null;
  },

  getSujetBySlug: async (slug: string): Promise<News | null> => {
    return newsService.getNewsBySlug(slug);
  },

  reactToNews: async (newsId: string, reactionType: TypeReaction): Promise<News> => {
    newsMemory = newsMemory.map((s) => {
      if (s.id === newsId || s.slug === newsId) {
        const currentReaction = s.userReaction;
        const newReactions = { ...s.stats.reactions };

        if (currentReaction === reactionType) {
          // toggle off
          newReactions[reactionType] = Math.max(0, newReactions[reactionType] - 1);
          return {
            ...s,
            userReaction: null,
            stats: { ...s.stats, reactions: newReactions },
          };
        } else {
          // change or add
          if (currentReaction) {
            newReactions[currentReaction] = Math.max(0, newReactions[currentReaction] - 1);
          }
          newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
          return {
            ...s,
            userReaction: reactionType,
            stats: { ...s.stats, reactions: newReactions },
          };
        }
      }
      return s;
    });
    return (await newsService.getNewsBySlug(newsId)) || newsMemory[0];
  },

  incrementHeart: async (newsId: string, count: number = 1): Promise<News> => {
    newsMemory = newsMemory.map((s) => {
      if (s.id === newsId || s.slug === newsId) {
        const newReactions = { ...s.stats.reactions };
        newReactions.coeur = (newReactions.coeur || 0) + count;
        return {
          ...s,
          userReaction: 'coeur',
          stats: { ...s.stats, reactions: newReactions },
        };
      }
      return s;
    });
    return (await newsService.getNewsBySlug(newsId)) || newsMemory[0];
  },

  reactToSujet: async (sujetId: string, reactionType: TypeReaction): Promise<News> => {
    return newsService.reactToNews(sujetId, reactionType);
  },

  createNews: async (newNewsData: Partial<News>): Promise<News> => {
    const slug = newNewsData.slug || (newNewsData.titre ? newNewsData.titre.toLowerCase().replace(/[^\w-]+/g, '-') : `news-${Date.now()}`);
    const created: News = {
      id: `news-${Date.now()}`,
      slug,
      type: newNewsData.type || 'consultation',
      titre: newNewsData.titre || 'Sans titre',
      description: newNewsData.description || '',
      contenu: newNewsData.contenu || '',
      image: newNewsData.image || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',
      auteur: newNewsData.auteur || {
        id: 'usr-student-789',
        username: 'amina_k',
        nomAffiche: 'Amina K.',
        role: 'etudiant',
        badges: [],
        stats: { contributions: 1, votes: 0, commentaires: 0 },
      },
      categorie: newNewsData.categorie || { id: 'cat-general', nom: 'Vie Académique', couleur: '#5B4DFF', icone: 'BookOpen' },
      tags: newNewsData.tags || ['Nouveau', 'Civitas'],
      province: newNewsData.province || 'Kinshasa',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statut: 'publie',
      visibilite: newNewsData.visibilite || 'public',
      stats: { vues: 1, commentaires: 0, reactions: { coeur: 0, jaime: 0, bravo: 0, youpi: 0, wow: 0, jaimepas: 0 }, votes: 0, partages: 0 },
      sondages: newNewsData.sondages || [],
      documents: newNewsData.documents || [],
    };
    newsMemory = [created, ...newsMemory];
    return created;
  },

  createSujet: async (newSujetData: Partial<News>): Promise<News> => {
    return newsService.createNews(newSujetData);
  },
};

export const sujetsService = newsService;

/**
  * Operational Backend API Service for News / Consultations
  */
export const newsBackendService = {
  getNews: async (params?: { category?: string; type?: NewsType; search?: string; province?: string }): Promise<News[]> => {
    const query = new URLSearchParams(params as any).toString();
    return apiClient.get<News[]>(`/news${query ? `?${query}` : ''}`);
  },

  getNewsBySlug: async (slug: string): Promise<News> => {
    return apiClient.get<News>(`/news/${slug}`);
  },

  reactToNews: async (newsId: string, reactionType: TypeReaction): Promise<News> => {
    return apiClient.post<News>(`/news/${newsId}/reactions`, { reaction: reactionType });
  },

  createNews: async (newNewsData: Partial<News>): Promise<News> => {
    return apiClient.post<News>('/news', newNewsData);
  },
};

export const sujetsBackendService = newsBackendService;


