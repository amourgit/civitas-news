// ============================================================
// src/services/api/endpoints.ts
// Registre CENTRAL de tous les chemins d'API consommés par le
// frontend. Aucune chaîne d'URL ne doit être écrite en dur dans un
// repository/service — tout passe par ce fichier.
//
// Deux catégories, clairement séparées :
//
//  - REAL_ENDPOINTS   : existent aujourd'hui dans Backend-Core-Base
//                        (branche civitas-news). Voir token_manager/,
//                        users/, tenants/, domain/.
//
//  - PLANNED_ENDPOINTS: convention cible pour les domaines métier
//                        (news, commentaires, sondages, liens,
//                        statistiques, notifications, administration)
//                        qui n'existent pas encore côté backend.
//                        Ils suivent la même convention que le reste
//                        de l'API (`/api/<app>/v1/...`) afin qu'un
//                        futur backend puisse les implémenter sans
//                        que le frontend ait à changer sa façon
//                        d'appeler ces routes — seul le flag
//                        `env.useRealContentApi` change de valeur.
// ============================================================

/** Endpoints réellement exposés par Backend-Core-Base aujourd'hui. */
export const AUTH_ENDPOINTS = {
  /** POST { username, password } -> { access, refresh, device_info } */
  login: '/token/v1/',
  /** POST { refresh } -> { access } */
  refresh: '/token/v1/refresh/',
  /** POST -> déconnexion + révocation du token courant */
  logout: '/token/v1/logout/',
  /** POST { access_token, refresh_token } -> vérifie/renouvelle si expiré */
  checkToken: '/token/v1/check-token/',
  /** GET -> liste des sessions actives ; DELETE -> révoque une session */
  sessions: (sessionId?: string | number) => (sessionId ? `/token/v1/sessions/${sessionId}/` : '/token/v1/sessions/'),
  tokenSettings: '/token/v1/settings/',
  tokenManager: (id?: string | number) => (id ? `/token/v1/tokens/${id}/` : '/token/v1/tokens/'),
} as const;

export const USERS_ENDPOINTS = {
  list: '/users/v1/users/',
  detail: (id: string | number) => `/users/v1/users/${id}/`,
  /** GET -> profil de l'utilisateur authentifié courant */
  me: '/users/v1/users/me/',
  changePassword: (id: string | number) => `/users/v1/users/${id}/change_password/`,
} as const;

export const TENANTS_ENDPOINTS = {
  create: '/tenants/v1/',
} as const;

export const DOMAIN_ENDPOINTS = {
  list: '/domain/v1/domains/',
  detail: (id: string | number) => `/domain/v1/domains/${id}/`,
} as const;

// ------------------------------------------------------------
// Domaines métier CIVITAS NEWS — pas encore implémentés côté
// backend. Convention prête pour la suite (voir env.useRealContentApi).
// ------------------------------------------------------------

export const NEWS_ENDPOINTS = {
  list: '/news/v1/news/',
  detail: (slugOrId: string) => `/news/v1/news/${slugOrId}/`,
  react: (id: string) => `/news/v1/news/${id}/reactions/`,
} as const;

export const COMMENTS_ENDPOINTS = {
  byNews: (newsId: string) => `/news/v1/news/${newsId}/commentaires/`,
  detail: (commentId: string) => `/news/v1/commentaires/${commentId}/`,
  vote: (commentId: string) => `/news/v1/commentaires/${commentId}/vote/`,
  react: (commentId: string) => `/news/v1/commentaires/${commentId}/reactions/`,
  pin: (commentId: string) => `/news/v1/commentaires/${commentId}/pin/`,
} as const;

export const SONDAGES_ENDPOINTS = {
  vote: (sondageId: string) => `/sondages/v1/sondages/${sondageId}/vote/`,
} as const;

export const LIENS_ENDPOINTS = {
  byNews: (newsId: string) => `/liens/v1/news/${newsId}/liens/`,
  create: (newsId: string) => `/liens/v1/news/${newsId}/liens/`,
} as const;

export const STATISTIQUES_ENDPOINTS = {
  globales: '/statistiques/v1/globales/',
} as const;

export const NOTIFICATIONS_ENDPOINTS = {
  list: '/notifications/v1/notifications/',
  markAsRead: (id: string) => `/notifications/v1/notifications/${id}/read/`,
  markAllAsRead: '/notifications/v1/notifications/read-all/',
} as const;

export const ADMIN_ENDPOINTS = {
  signalements: '/administration/v1/signalements/',
  traiterSignalement: (id: string) => `/administration/v1/signalements/${id}/traiter/`,
  auditLogs: '/administration/v1/audit-logs/',
  utilisateurs: '/administration/v1/utilisateurs/',
} as const;
