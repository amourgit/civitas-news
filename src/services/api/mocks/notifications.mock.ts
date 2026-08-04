// ============================================================
// src/services/api/mocks/notifications.mock.ts
// Données factices du domaine Notifications — déplacé depuis
// src/store/notifications.store.ts pour séparer données et état.
// ============================================================

import type { NotificationItem } from '../../../types/global.types';

const INITIAL_NOTIFICATIONS_DATA: NotificationItem[] = [
  // --- AUJOURD'HUI ---
  {
    id: 'notif-101',
    format: 'actualite',
    titre: 'Réforme Tarifaire des Transports Étudiants 2026',
    description: 'Le Ministère des Transports et le Conseil Supérieur Académique ont publié les modalités de souscription à la carte mensuelle unique à tarif réduit pour tous les campus.',
    categorie: { nom: 'Transports & Mobilité', couleur: '#5B4DFF', icone: 'Bus' },
    lien: '/news/reforme-transport-etudiant-2026',
    tag: 'RÉF-TRANS-2026',
    urgente: true,
    categoryTab: 'news',
    lu: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 Min Ago
    notice: '⚠️ Date limite de validation des formulaires de réduction : 15 Septembre 2026.',
    actions: [
      {
        label: 'Consulter l’actualité',
        variant: 'primary',
        actionKey: 'view_news',
        url: '/news/reforme-transport-etudiant-2026',
        toastType: 'info',
        toastTitle: 'Information Transports',
        toastMessage: 'Redirection vers la fiche complète de la réforme.',
      },
      {
        label: 'Soutenir la réforme',
        variant: 'purple',
        actionKey: 'support_reforme',
        toastType: 'purple',
        toastTitle: 'Soutien enregistré !',
        toastMessage: 'Votre voix a été ajoutée au registre civique officiel.',
      },
    ],
  },
  {
    id: 'notif-102',
    format: 'sondage',
    titre: 'Sondage National : Usage de l’IA Générative dans les Travaux Académiques',
    description: 'Un nouveau sondage national est ouvert. Votez pour exprimer votre position sur la future Charte Éthique de l\'IA à l\'Université.',
    categorie: { nom: 'Innovation & IA', couleur: '#7B61FF', icone: 'Cpu' },
    lien: '/news/sondage-intelligence-artificielle-ethique-universite',
    tag: 'SONDAGE-IA-2026',
    categoryTab: 'sondages',
    lu: false,
    createdAt: new Date(Date.now() - 1000 * 3600 * 1.5).toISOString(), // 1.5h ago
    actions: [
      {
        label: 'Participer au vote',
        variant: 'success',
        actionKey: 'vote_sondage',
        url: '/news/sondage-intelligence-artificielle-ethique-universite',
        toastType: 'success',
        toastTitle: 'Accès au Sondage IA',
        toastMessage: 'Exprimez votre vote dans la consultation publique.',
      },
    ],
  },
  {
    id: 'notif-103',
    format: 'annonce',
    titre: 'Ouverture du Guichet Unique des Bourses d’Excellence 2026-2027',
    description: 'La direction des affaires financières annonce le lancement de la campagne 2026-2027. 5 000 bourses seront attribuées selon les critères de mérite et d\'engagement.',
    categorie: { nom: 'Carrière & Emploi', couleur: '#16A34A', icone: 'Briefcase' },
    lien: '/news/annonce-lancement-bourses-excellence-2026',
    tag: 'BOURSE-EXCELLENCE',
    categoryTab: 'news',
    lu: false,
    createdAt: new Date(Date.now() - 1000 * 3600 * 4).toISOString(), // 4h ago
    actions: [
      {
        label: 'Voir l’annonce officielle',
        variant: 'outline',
        actionKey: 'view_announcement',
        url: '/news/annonce-lancement-bourses-excellence-2026',
        toastType: 'info',
        toastTitle: 'Détails de l’Annonce',
        toastMessage: 'Consultation des critères d’éligibilité.',
      },
      {
        label: 'Partager le lien',
        variant: 'blue',
        actionKey: 'share_announcement',
        toastType: 'info',
        toastTitle: 'Lien Copié !',
        toastMessage: 'Lien de partage prêt à être diffusé.',
      },
    ],
  },
  {
    id: 'notif-104',
    format: 'alerte',
    titre: 'Alerte Sanitaire : Inspection des Restaurants Universitaires',
    description: 'Rapport urgent publié concernant l’amélioration de la qualité nutritive et des mesures d’hygiène dans les cantines scolaires de Kongo-Central.',
    categorie: { nom: 'Alimentation & Santé', couleur: '#F59E0B', icone: 'Utensils' },
    lien: '/news/petitions-restaurants-universitaires-qualite-prix',
    tag: 'ALERTE-RESTOU',
    urgente: true,
    categoryTab: 'alertes',
    lu: false,
    createdAt: new Date(Date.now() - 1000 * 3600 * 6).toISOString(), // 6h ago
    notice: '⚠️ Avis aux étudiants : vérifiez les normes mises à jour pour la restauration sur campus.',
    actions: [
      {
        label: 'Lire le rapport sanitaire',
        variant: 'warning',
        actionKey: 'view_report',
        url: '/news/petitions-restaurants-universitaires-qualite-prix',
        toastType: 'warning',
        toastTitle: 'Alerte Sanitaire',
        toastMessage: 'Ouverture du rapport d’inspection des cantines.',
      },
    ],
  },

  // --- HIER ---
  {
    id: 'notif-201',
    format: 'consultation',
    titre: 'Consultation Citoyenne : Modernisation du Réseau WiFi & Équipements Cyber',
    description: 'Le comité numérique consulte les délégués et étudiants sur le déploiement de la fibre optique et du WiFi 7 sur l’ensemble des campus.',
    categorie: { nom: 'Innovation & IA', couleur: '#7B61FF', icone: 'Wifi' },
    lien: '/news/consultation-plan-numerique-campus',
    tag: 'CONSULT-WIFI7',
    categoryTab: 'direct',
    lu: true,
    createdAt: new Date(Date.now() - 1000 * 3600 * 25).toISOString(),
    actions: [
      {
        label: 'Donner son avis',
        variant: 'purple',
        actionKey: 'submit_idea',
        url: '/news/consultation-plan-numerique-campus',
        toastType: 'purple',
        toastTitle: 'Espace Consultation',
        toastMessage: 'Ajoutez vos propositions au projet WiFi 7.',
      },
    ],
  },
  {
    id: 'notif-202',
    format: 'reforme',
    titre: 'Décret Portant Harmonisation des Crédits Académiques et Mobilité National',
    description: 'Publication du nouveau guide officiel pour la conversion des crédits et la reconnaissance des équivalences inter-universitaires.',
    categorie: { nom: 'Gouvernance Académique', couleur: '#0284C7', icone: 'GraduationCap' },
    lien: '/news/reforme-transport-etudiant-2026',
    tag: 'DÉCRET-2026-09',
    categoryTab: 'news',
    lu: true,
    createdAt: new Date(Date.now() - 1000 * 3600 * 28).toISOString(),
    actions: [
      {
        label: 'Consulter le décret',
        variant: 'outline',
        actionKey: 'view_decret',
        url: '/news/reforme-transport-etudiant-2026',
        toastType: 'info',
        toastTitle: 'Décret Académique',
        toastMessage: 'Affichage des articles révisés.',
      },
    ],
  },

  // --- PLUS ANCIENS ---
  {
    id: 'notif-301',
    format: 'sondage',
    titre: 'Sondage Express : Horaires d’Ouverture de la Bibliothèque Centrale',
    description: 'Proposez vos plages horaires préférées pour l’accès nocturne et dominical pendant les périodes d’examens nationaux.',
    categorie: { nom: 'Vie Étudiante', couleur: '#EC4899', icone: 'BookOpen' },
    lien: '/news/sondage-intelligence-artificielle-ethique-universite',
    tag: 'VOTE-BU-2026',
    categoryTab: 'sondages',
    lu: true,
    createdAt: new Date(Date.now() - 1000 * 3600 * 52).toISOString(),
    actions: [
      {
        label: 'Voir les résultats',
        variant: 'success',
        actionKey: 'view_results',
        url: '/news/sondage-intelligence-artificielle-ethique-universite',
        toastType: 'success',
        toastTitle: 'Résultats du Sondage',
        toastMessage: 'Consultation des tendances de votes.',
      },
    ],
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = INITIAL_NOTIFICATIONS_DATA;
