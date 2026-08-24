// ============================================================
// src/services/api/endpoints.ts
// Registre CENTRAL de tous les chemins d'API consommés par le
// frontend. Aucune chaîne d'URL ne doit être écrite en dur dans un
// repository/service — tout passe par ce fichier.
//
// Tous les chemins ci-dessous existent aujourd'hui dans
// Backend-Core-Base (branche civitas-news) et sont vérifiés contre
// les urls.py/views.py réels de chaque app (token_manager, users,
// tenants, domain, referentiels, news, commentaires, sondages, liens,
// notifications, moderation, journal, statistiques).
//
// Note : chaque endpoint de LISTE renvoie l'enveloppe de pagination
// DRF (`{ count, next, previous, results }`), jamais un tableau nu —
// voir `services/api/utils/pagination.ts`, consommé par les
// repositories correspondants.
// ============================================================

/** Endpoints réellement exposés par Backend-Core-Base aujourd'hui. */
export const AUTH_ENDPOINTS = {

  /** POST { identifiant: string (email OU téléphone), password } -> { access, refresh, device_info }. 404 code='ACCOUNT_NOT_FOUND' si l'identifiant n'existe pas, 401 code='INVALID_CREDENTIALS' si le mot de passe est erroné. */
  login: '/token/v1/',
  /** POST { identifiant: string (email OU téléphone), password } -> { access, refresh, device_info } (auto-connexion après création). */
  register: '/token/v1/register/',
  /** POST { credential: <id_token Google Identity Services> } -> { access, refresh, device_info } */
  googleLogin: '/token/v1/google/',
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
  /** POST — réservé aux superusers côté backend (voir UserViewSet.get_permissions). */
  create: '/users/v1/users/',
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
// Domaines métier CIVITAS NEWS — implémentés côté backend depuis le
// commit "construction complète du domaine métier CIVITAS NEWS"
// (Backend-Core-Base, branche civitas-news). Chemins vérifiés contre
// les urls.py/views.py réels de chaque app.
// ------------------------------------------------------------

/**
 * Données de référence (app backend `referentiels/`) : catégories
 * éditoriales, organisations publiantes, établissements. Utilisées pour
 * peupler les sélecteurs du formulaire de création de News.
 */
export const REFERENTIELS_ENDPOINTS = {
  categories: '/referentiels/v1/categories/',
  categorieDetail: (id: string) => `/referentiels/v1/categories/${id}/`,
  organisations: '/referentiels/v1/organisations/',
  organisationDetail: (id: string) => `/referentiels/v1/organisations/${id}/`,
  etablissements: '/referentiels/v1/etablissements/',
  etablissementDetail: (id: string) => `/referentiels/v1/etablissements/${id}/`,
} as const;

export const NEWS_ENDPOINTS = {
  list: '/news/v1/news/',
  detail: (slugOrId: string) => `/news/v1/news/${slugOrId}/`,
  react: (id: string) => `/news/v1/news/${id}/reactions/`,
  /** POST -> incrémente le compteur de partages, renvoie { partages }. */
  partager: (id: string) => `/news/v1/news/${id}/partager/`,
  /**
   * Sous-ressources dédiées (app backend séparée, PAS imbriquée sous
   * /news/{id}/ — même convention que commentaires/sondages/liens) :
   * filtrage par `?news=<id>` en liste, `news` requis dans le corps en
   * création. Gérées depuis les onglets "Médias"/"Galerie"/"Documents"
   * de la page de détail News du backoffice.
   */
  medias: '/news/v1/medias/',
  mediaDetail: (id: string) => `/news/v1/medias/${id}/`,
  galerie: '/news/v1/galerie/',
  galerieDetail: (id: string) => `/news/v1/galerie/${id}/`,
  documents: '/news/v1/documents/',
  documentDetail: (id: string) => `/news/v1/documents/${id}/`,
} as const;

/**
 * App backend séparée (`commentaires/`), PAS imbriquée sous /news/.
 * Le filtrage par news se fait en query param (`?news={id}`), et la
 * création exige `news` dans le corps de la requête (voir
 * commentaires/api/v1/views.py: perform_create).
 */
export const COMMENTS_ENDPOINTS = {
  list: '/commentaires/v1/commentaires/',
  detail: (commentId: string) => `/commentaires/v1/commentaires/${commentId}/`,
  vote: (commentId: string) => `/commentaires/v1/commentaires/${commentId}/vote/`,
  react: (commentId: string) => `/commentaires/v1/commentaires/${commentId}/reactions/`,
  pin: (commentId: string) => `/commentaires/v1/commentaires/${commentId}/pin/`,
} as const;

export const SONDAGES_ENDPOINTS = {
  list: '/sondages/v1/sondages/',
  create: '/sondages/v1/sondages/',
  detail: (sondageId: string) => `/sondages/v1/sondages/${sondageId}/`,
  vote: (sondageId: string) => `/sondages/v1/sondages/${sondageId}/vote/`,
} as const;

/**
 * App backend séparée (`liens/`), PAS imbriquée sous /liens/v1/news/.
 * Filtrage par news en query param (`?news=`) ; création exige `news`
 * dans le corps de la requête.
 */
export const LIENS_ENDPOINTS = {
  list: '/liens/v1/liens/',
  create: '/liens/v1/liens/',
  detail: (id: string) => `/liens/v1/liens/${id}/`,
  /** POST public (pas d'auth requise) -> trace un clic/scan, renvoie { valide, aMotDePasse }. */
  acceder: (id: string) => `/liens/v1/liens/${id}/acceder/`,
} as const;

export const STATISTIQUES_ENDPOINTS = {
  globales: '/statistiques/v1/globales/',
} as const;

export const NOTIFICATIONS_ENDPOINTS = {
  list: '/notifications/v1/notifications/',
  detail: (id: string) => `/notifications/v1/notifications/${id}/`,
  markAsRead: (id: string) => `/notifications/v1/notifications/${id}/read/`,
  markAllAsRead: '/notifications/v1/notifications/read-all/',
} as const;

/**
 * Le panneau d'administration frontend regroupe des ressources qui
 * vivent en réalité dans DEUX apps backend séparées :
 *  - `moderation/` : signalements + annuaire utilisateurs admin
 *  - `journal/`    : journal d'audit (EvenementJournal)
 * (il n'existe PAS d'app/préfixe unique `/administration/`).
 */
export const ADMIN_ENDPOINTS = {
  signalements: '/moderation/v1/signalements/',
  signalementDetail: (id: string) => `/moderation/v1/signalements/${id}/`,
  traiterSignalement: (id: string) => `/moderation/v1/signalements/${id}/traiter/`,
  utilisateurs: '/moderation/v1/utilisateurs/',
} as const;

export const JOURNAL_ENDPOINTS = {
  evenements: '/journal/v1/evenements/',
  evenementDetail: (id: string) => `/journal/v1/evenements/${id}/`,
} as const;
