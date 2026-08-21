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
  VITE_TENANT_HOST?: string;
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

const browserTenantHost = getCurrentTenantHost();

/**
 * Logique de priorité pour le tenant envoyé dans l'en-tête X-Tenant-Domain
 * -- extraite en fonction pure (plutôt qu'inlinée) pour rester testable
 * directement avec de simples chaînes, sans dépendre de import.meta.env
 * (remplacé STATIQUEMENT par Vite à la transformation : le mocker au
 * runtime dans un test n'a aucun effet, contrairement à un `.env` réel
 * chargé par le vrai serveur de dev/build -- voir
 * config/__tests__/env.test.ts).
 *
 *   1. `explicit` (VITE_TENANT_HOST), si défini et non vide -- déploiement
 *      volontairement pointé sur UN tenant précis, indépendamment de ce
 *      que le navigateur affiche (utile dès que le domaine réel peut
 *      varier : déploiements de prévisualisation Vercel avec une URL
 *      générée à chaque fois, un futur domaine personnalisé, un
 *      renommage du projet Vercel... -- aucun de ces cas ne doit exiger
 *      de retoucher le code ou la table Domain côté backend, seulement
 *      cette variable). Voir .env.example -- vaut "civitasnews" pour ce
 *      déploiement.
 *   2. Sinon, `browserHost` -- le hostname RÉELLEMENT affiché dans le
 *      navigateur (comportement historique, pratique en dev local
 *      multi-tenant : chaque sous-domaine *.localhost obtient son bon
 *      tenant sans rien configurer).
 */
export function resolveTenantHost(explicit: string | undefined, browserHost: string | null): string | null {
  const trimmed = explicit?.trim();
  return trimmed ? trimmed : browserHost;
}

// Valeur envoyée dans l'en-tête X-Tenant-Domain, voir resolveTenantHost
// ci-dessus et services/api/token/authFetchInterceptor.ts.
const tenantHost = resolveTenantHost(rawEnv.VITE_TENANT_HOST, browserTenantHost);

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
  if (rawEnv.VITE_API_BASE_URL) {
    warnIfApiBaseUrlMismatchesBrowserTenant(rawEnv.VITE_API_BASE_URL);
    return rawEnv.VITE_API_BASE_URL;
  }
  if (isProd || !browserTenantHost) return '/api';
  const port = rawEnv.VITE_API_PORT || '8000';
  return `${getCurrentProtocol()}//${browserTenantHost}:${port}/api`;
}

/**
 * VITE_API_BASE_URL explicite écrase la construction dynamique — utile
 * en soi (override volontaire), mais piège classique s'il traîne d'un
 * .env plus ancien (voir .env.example) : le navigateur affiche un
 * sous-domaine tenant (ex: civitas.localhost:3000) tandis que toutes
 * les requêtes partent silencieusement vers une origine FIXE différente
 * (ex: localhost:8000, le domaine racine) — le backend les rejette
 * (tenants/middleware.py, 400 TENANT_REQUIRED) ou CORS les bloque, sans
 * qu'aucun message n'indique la vraie cause. Avertit explicitement
 * plutôt que de laisser deviner.
 */
function warnIfApiBaseUrlMismatchesBrowserTenant(fixedApiBaseUrl: string): void {
  if (!browserTenantHost || typeof console === 'undefined') return;
  try {
    const fixedHost = new URL(fixedApiBaseUrl, `${getCurrentProtocol()}//${browserTenantHost}`).hostname;
    if (fixedHost !== browserTenantHost) {
      console.warn(
        `[env] VITE_API_BASE_URL ("${fixedApiBaseUrl}") cible l'hôte "${fixedHost}", ` +
          `différent du sous-domaine affiché dans le navigateur ("${browserTenantHost}"). ` +
          `Si ce n'est pas un override volontaire, retirez VITE_API_BASE_URL de votre ` +
          `.env local pour laisser l'URL se reconstruire automatiquement depuis l'URL ` +
          `courante (voir .env.example).`
      );
    }
  } catch {
    // URL malformée -> pas notre rôle de le signaler ici, le fetch échouera explicitement.
  }
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
   * Valeur envoyée sur chaque requête via l'en-tête X-Tenant-Domain (voir
   * services/api/token/authFetchInterceptor.ts) comme mécanisme
   * ALTERNATIF de résolution du tenant côté backend, testé EN PARALLÈLE
   * du sous-domaine par TenantMiddleware._resolve_tenant_dual (voir
   * Backend-Core-Base, tenants/middleware.py) -- utile même quand
   * apiBaseUrl est explicitement fixé par VITE_API_BASE_URL (auquel cas
   * l'en-tête reste la seule façon fiable de faire remonter le tenant,
   * puisque le Host effectivement reçu par Django serait alors celui de
   * l'URL fixe, pas celui du navigateur), et INDISPENSABLE en production
   * sur Render (plan gratuit) qui ne fournit aucun certificat TLS valide
   * pour les sous-domaines de *.onrender.com -- le Host vu par Django y
   * est donc toujours son propre domaine racine, jamais un sous-domaine
   * de tenant.
   *
   * Priorité VITE_TENANT_HOST (déploiement figé sur un tenant précis,
   * indépendant de ce que le navigateur affiche réellement -- "civitasnews"
   * pour ce déploiement, voir .env.example) sinon repli sur le hostname
   * réellement affiché dans le navigateur (dev local multi-tenant).
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
