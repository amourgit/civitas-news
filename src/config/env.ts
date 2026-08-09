// ============================================================
// src/config/env.ts
// Point d'entrée unique pour lire les variables d'environnement
// Vite (import.meta.env). Toute nouvelle variable VITE_* doit être
// exposée ici plutôt que lue directement dans le code métier —
// cela évite d'avoir des `import.meta.env.VITE_...` dispersés dans
// des dizaines de fichiers de services.
//
// Règle de bascule mock / API réelle (voir services/*.service.ts) :
//   - En PRODUCTION (`vite build`, `import.meta.env.PROD === true`),
//     TOUS les services utilisent automatiquement les vraies données
//     via services/api/repositories/. Aucune donnée mock n'est
//     livrée en production.
//   - En développement, les mocks sont utilisés par défaut (itération
//     rapide sans dépendre d'un backend local démarré), mais peuvent
//     être désactivés à la demande avec VITE_USE_MOCK_DATA=false
//     pour tester contre un vrai backend en local.
//   - VITE_USE_MOCK_DATA, si définie explicitement, a toujours la
//     priorité (permet aussi de forcer le mock en production pour
//     une démo, par exemple).
// ============================================================

interface ImportMetaEnvLike {
  VITE_API_BASE_URL?: string;
  VITE_API_PORT?: string;
  VITE_USE_MOCK_DATA?: string;
  VITE_GOOGLE_CLIENT_ID?: string;
  DEV?: boolean;
  PROD?: boolean;
  MODE?: string;
}

import { getCurrentTenantHost, getCurrentProtocol } from './tenantHost';

const rawEnv = ((import.meta as unknown as { env?: ImportMetaEnvLike }).env ?? {}) as ImportMetaEnvLike;

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined || value === '') return undefined;
  return value === 'true' || value === '1';
}

const isProd = Boolean(rawEnv.PROD);
const isDev = Boolean(rawEnv.DEV) || !isProd;

// Priorité : VITE_USE_MOCK_DATA explicite > automatique selon l'environnement.
const explicitMockFlag = parseBoolean(rawEnv.VITE_USE_MOCK_DATA);
const useMockData = explicitMockFlag !== undefined ? explicitMockFlag : isDev;

const tenantHost = getCurrentTenantHost();

/**
 * Détermine apiBaseUrl :
 *  1. VITE_API_BASE_URL explicite -> toujours prioritaire (override total,
 *     ex: une API sur un domaine complètement distinct du frontend).
 *  2. En PRODUCTION sans override -> chemin relatif '/api'. Frontend et
 *     backend sont censés partager la même origine derrière un reverse
 *     proxy commun ; un chemin relatif hérite alors automatiquement du
 *     bon sous-domaine tenant, sans rien construire.
 *  3. En DÉVELOPPEMENT sans override -> reconstruit l'URL à partir du
 *     hostname RÉELLEMENT affiché dans le navigateur (ex:
 *     "civitas.localhost") + VITE_API_PORT (Django tourne sur un port
 *     différent de Vite : :8000 vs :3000, deux origines distinctes,
 *     un chemin relatif ne suffit pas). C'est ce qui fait qu'ouvrir le
 *     frontend sur civitas.localhost:3000 cible bien
 *     civitas.localhost:8000/api côté backend, au lieu de toujours
 *     retomber sur le domaine racine.
 */
function resolveApiBaseUrl(): string {
  if (rawEnv.VITE_API_BASE_URL) return rawEnv.VITE_API_BASE_URL;
  if (isProd || !tenantHost) return '/api';
  const port = rawEnv.VITE_API_PORT || '8000';
  return `${getCurrentProtocol()}//${tenantHost}:${port}/api`;
}

export const env = {
  /**
   * Base URL de l'API backend (Backend-Core-Base). En dev, reconstruite
   * dynamiquement depuis le hostname courant du navigateur (voir
   * resolveApiBaseUrl ci-dessus) — pas une valeur figée une fois pour
   * toutes, précisément pour que le sous-domaine tenant affiché dans la
   * barre d'adresse soit celui réellement ciblé côté backend.
   */
  apiBaseUrl: resolveApiBaseUrl(),

  /**
   * Hostname courant du navigateur (ex: "civitas.localhost"), sans le
   * port. Envoyé sur chaque requête via l'en-tête X-Tenant-Domain (voir
   * services/api/token/authFetchInterceptor.ts) comme mécanisme
   * ALTERNATIF de résolution du tenant côté backend
   * (config/fonction.py:resolve_request_hostname), utile même quand
   * apiBaseUrl est explicitement fixé par VITE_API_BASE_URL (auquel cas
   * l'en-tête reste la seule façon fiable de faire remonter le vrai
   * sous-domaine, puisque le Host effectivement reçu par Django serait
   * alors celui de l'URL fixe, pas celui du navigateur).
   */
  tenantHost,

  /**
   * true  -> les services lisent/écrivent dans les données mock locales
   *          (services/api/mocks/), utile en développement/démo.
   * false -> les services appellent le vrai backend via
   *          services/api/repositories/. C'est TOUJOURS le cas en
   *          production, sauf override explicite.
   */
  useMockData,

  isDev,
  isProd,
  mode: rawEnv.MODE || 'development',

  /**
   * OAuth Client ID (type "Web application") créé dans Google Cloud
   * Console — voir components/auth/GoogleSignInButton.tsx. DOIT être
   * identique à GOOGLE_OAUTH_CLIENT_ID côté backend (Backend-Core-Base
   * config/settings.py), c'est l'audience vérifiée sur le id_token.
   * Chaîne vide -> le bouton Google Sign-In s'affiche désactivé avec un
   * message clair plutôt que d'échouer silencieusement.
   */
  googleClientId: rawEnv.VITE_GOOGLE_CLIENT_ID || '',
};

export type Env = typeof env;
