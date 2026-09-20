// ============================================================
// src/lib/permissions/permissions.catalog.ts
// Catalogue EXHAUSTIF des permissions frontend, granulaires par
// domaine et par action. Toute nouvelle capacité UI (bouton,
// action, route) doit être déclarée ici plutôt que testée via
// `user.role === 'administrateur'` en dur dans un composant.
//
// Convention : '<domaine>:<action>[:<portee>]'
//   - domaine : news, commentaire, sondage, lien, notification,
//               statistiques, admin, utilisateur
//   - action  : view, create, edit, delete, ...
//   - portee  : 'own' (ses propres ressources) | 'any' (toutes)
// ============================================================

export const PERMISSIONS = {
  // News / Sujets
  NEWS_VIEW: 'news:view',
  NEWS_CREATE: 'news:create',
  NEWS_EDIT_OWN: 'news:edit:own',
  NEWS_EDIT_ANY: 'news:edit:any',
  NEWS_DELETE_OWN: 'news:delete:own',
  NEWS_DELETE_ANY: 'news:delete:any',
  NEWS_PUBLISH: 'news:publish',
  NEWS_PIN: 'news:pin',
  NEWS_REACT: 'news:react',

  // Commentaires
  COMMENTAIRE_VIEW: 'commentaire:view',
  COMMENTAIRE_CREATE: 'commentaire:create',
  COMMENTAIRE_DELETE_OWN: 'commentaire:delete:own',
  COMMENTAIRE_DELETE_ANY: 'commentaire:delete:any',
  COMMENTAIRE_PIN: 'commentaire:pin',
  COMMENTAIRE_MODERATE: 'commentaire:moderate',

  // Sondages
  SONDAGE_VIEW: 'sondage:view',
  SONDAGE_VOTE: 'sondage:vote',
  SONDAGE_CREATE: 'sondage:create',

  // Liens de publication
  LIEN_CREATE: 'lien:create',
  LIEN_DELETE: 'lien:delete',

  // Notifications
  NOTIFICATION_MANAGE_OWN: 'notification:manage:own',

  // Statistiques
  STATISTIQUES_VIEW: 'statistiques:view',

  // Administration / Modération
  ADMIN_ACCESS: 'admin:access',
  ADMIN_SIGNALEMENT_TRAITER: 'admin:signalement:traiter',
  ADMIN_AUDIT_VIEW: 'admin:audit:view',
  ADMIN_UTILISATEUR_GERER: 'admin:utilisateur:gerer',
  // Édition FINE d'une fiche utilisateur (voir
  // components/backoffice/users/profile/userProfile.schema.ts : chaque
  // champ déclare la permission qui gouverne son édition). GERER reste
  // la porte d'entrée (accès à la fiche + bouton « Modifier ») ; ces
  // cinq-là décident QUOI on peut y modifier -- ex : accorder
  // EDIT_STATUT à un profil « support » sans lui donner le pouvoir de
  // promouvoir un compte (EDIT_ROLE).
  ADMIN_UTILISATEUR_EDIT_IDENTITE: 'admin:utilisateur:edit:identite',
  ADMIN_UTILISATEUR_EDIT_CONTACT: 'admin:utilisateur:edit:contact',
  ADMIN_UTILISATEUR_EDIT_ROLE: 'admin:utilisateur:edit:role',
  ADMIN_UTILISATEUR_EDIT_RATTACHEMENT: 'admin:utilisateur:edit:rattachement',
  ADMIN_UTILISATEUR_EDIT_STATUT: 'admin:utilisateur:edit:statut',
  // Raccourci "Publier un article" du bouton flottant d'actions rapides
  // (voir components/layout/fab/QuickActionsFab.tsx) : volontairement
  // distinct de NEWS_CREATE (accordé dès le rôle 'organisation') --
  // ce raccourci global n'a de sens que pour le rôle 'administrateur'
  // strict, pas pour 'moderateur' ni 'organisation'.
  ADMIN_QUICK_NEWS_CREATE: 'admin:quick-news:create',

  // Backoffice (src/components/backoffice/) — gestion des référentiels
  // et modération avancée. Distinct de ADMIN_ACCESS (qui n'ouvre que le
  // tableau de bord/liste de signalements) : ces permissions gouvernent
  // les tables complètes du panneau d'administration façon "Django
  // admin" (voir src/components/backoffice/registry/).
  BACKOFFICE_ACCESS: 'backoffice:access',
  REFERENTIEL_VIEW: 'referentiel:view',
  REFERENTIEL_MANAGE: 'referentiel:manage',
  BACKOFFICE_NEWS_MANAGE: 'backoffice:news:manage',
  BACKOFFICE_COMMENTAIRE_MANAGE: 'backoffice:commentaire:manage',
  BACKOFFICE_SONDAGE_MANAGE: 'backoffice:sondage:manage',
  BACKOFFICE_LIEN_MANAGE: 'backoffice:lien:manage',
  BACKOFFICE_NOTIFICATION_VIEW: 'backoffice:notification:view',
  BACKOFFICE_SIGNALEMENT_MANAGE: 'backoffice:signalement:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
