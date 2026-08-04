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
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
