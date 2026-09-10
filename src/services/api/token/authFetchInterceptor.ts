// ============================================================
// src/services/api/token/authFetchInterceptor.ts
// Deux responsabilités, toutes deux nécessitant d'intercepter TOUS les
// appels fetch existants (GetService/PostService/UpdateService/
// DeleteService en font des dizaines, dispersés — upload, batch,
// suppression douce...) sans toucher au code de ces 4 services :
//
//  1. Refresh automatique et transparent du token sur une réponse 401.
//     Sans ceci, un access token expiré (durée de vie courte par
//     design — TokenSettings.access_token_lifetime) ferait échouer en
//     401 la PROCHAINE requête de l'utilisateur, qui devrait alors se
//     reconnecter manuellement même si sa session (refresh token) est
//     encore valide.
//
//  2. En-tête X-Tenant-Domain sur chaque requête vers notre API.
//     Valeur résolue DYNAMIQUEMENT via un getter fourni par l'appelant
//     (voir installAuthFetchInterceptor ci-dessous) — PLUS une chaîne
//     figée à l'installation : le getter passé depuis main.tsx
//     (store/tenants.store.ts::getTenantHeaderValue) porte soit la
//     liste CSV des tenants explicitement ACTIVÉS par l'utilisateur,
//     soit, si aucun n'est activé, le repli HISTORIQUE à un seul
//     tenant (sous-domaine du navigateur ou VITE_TENANT_HOST — voir
//     config/env.ts / config/tenantHost.ts). Le backend
//     (config/fonction.py:resolve_request_hostname côté tenant unique,
//     futur middleware multi-tenant côté liste CSV) le préfère au Host
//     HTTP standard quand présent. Utile même quand apiBaseUrl cible
//     une origine fixe (VITE_API_BASE_URL explicite) : dans ce cas le
//     Host effectivement reçu par Django serait celui de cette URL
//     fixe, pas celui du navigateur — l'en-tête reste alors la seule
//     façon fiable de faire remonter le(s) vrai(s) tenant(s).
//
// `window.fetch` est remplacé UNE SEULE FOIS, au démarrage de l'app
// (voir installAuthFetchInterceptor(), appelé depuis main.tsx).
// ============================================================

import { tokenStore } from './tokenStore';
import { toast } from '../../../hooks/useToast';

let installed = false;
let originalFetch: typeof window.fetch | null = null;
let currentApiBaseUrl: string | null = null;
// Getter (pas une valeur figée) : appelé à CHAQUE requête pour refléter
// en temps réel l'activation/désactivation de tenants par l'utilisateur
// (voir store/tenants.store.ts::getTenantHeaderValue), sans jamais
// avoir besoin de réinstaller l'intercepteur.
let getTenantHeaderValueFn: (() => string | null) | null = null;

// Dédupliqué entre appels concurrents : si 3 requêtes échouent en 401
// en même temps (ou si un refresh RÉACTIF sur 401 et un refresh PROACTIF
// planifié par tokenLifecycle.ts se chevauchent), un seul refresh réseau
// est déclenché, tous les appelants attendent la même promesse.
let refreshPromise: Promise<string | null> | null = null;

// Un refresh qui ne répond jamais (réseau capricieux) ne doit ni bloquer
// indéfiniment l'appelant ni laisser un `refreshPromise` fantôme empêcher
// toute nouvelle tentative -- le `finally` sur refreshPromise s'en charge,
// ce timeout garantit juste que ce `finally` arrive dans un délai borné.
const REFRESH_TIMEOUT_MS = 10000;

function isOwnApiRequest(input: RequestInfo | URL, apiBaseUrl: string): boolean {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  if (url.startsWith('/')) return true; // chemin relatif -> forcément notre backend
  try {
    const target = new URL(url, window.location.origin);
    const base = new URL(apiBaseUrl, window.location.origin);
    return target.origin === base.origin;
  } catch {
    return false;
  }
}

function isRefreshEndpoint(input: RequestInfo | URL): boolean {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  return url.includes('/token/v1/refresh');
}

async function performRefresh(apiBaseUrl: string, tenantHost: string | null): Promise<string | null> {
  const refreshToken = tokenStore.getRefreshToken();
  // originalFetch n'est capturé qu'à l'installation (main.tsx, avant le
  // rendu de l'app) -- en pratique toujours prêt ici, mais on retombe sur
  // window.fetch pour rester utilisable même appelé avant installation
  // (ex: futurs tests unitaires de tokenLifecycle.ts en isolation).
  const doFetch = originalFetch ?? (typeof window !== 'undefined' ? window.fetch.bind(window) : null);
  if (!refreshToken || !doFetch) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);
  try {
    const response = await doFetch(`${apiBaseUrl}/token/v1/refresh/`, {
      method: 'POST',
      headers: withTenantHeader({ 'Content-Type': 'application/json' }, tenantHost),
      body: JSON.stringify({ refresh: refreshToken }),
      signal: controller.signal,
    });
    if (!response.ok) {
      tokenStore.clear();
      notifySessionExpired();
      return null;
    }
    const data = (await response.json()) as { access?: string; refresh?: string };
    if (!data.access) {
      tokenStore.clear();
      notifySessionExpired();
      return null;
    }
    tokenStore.setTokens({ access: data.access, refresh: data.refresh });
    return data.access;
  } catch {
    // Erreur réseau OU timeout pendant le refresh : on ne vide PAS la
    // session (elle est peut-être encore valide, c'est juste le réseau
    // qui a un problème passager) — on échoue juste cette tentative.
    // tokenLifecycle.ts retente ensuite avec backoff sur le chemin
    // proactif ; le chemin réactif (401) laisse simplement remonter le
    // 401 d'origine à l'appelant, qui peut retenter sa propre requête.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Avant ce correctif, une session terminée (refresh token expiré/rejeté)
// ne se voyait qu'au silence : l'utilisateur retombait anonyme sans aucune
// explication, la topbar changeant d'état sans un mot. Ce toast comble ce
// vide -- ne se déclenche QUE depuis un refresh réellement REJETÉ par le
// serveur (jamais sur une déconnexion manuelle, qui ne passe jamais par
// performRefresh).
function notifySessionExpired(): void {
  toast('warning', 'Session expirée', 'Veuillez vous reconnecter pour continuer.');
}

function withTenantHeader(headers: HeadersInit | undefined, tenantHost: string | null): Headers {
  const result = new Headers(headers);
  if (tenantHost && !result.has('X-Tenant-Domain')) {
    result.set('X-Tenant-Domain', tenantHost);
  }
  return result;
}

function withAuthorization(init: RequestInit | undefined, accessToken: string, tenantHost: string | null): RequestInit {
  const headers = withTenantHeader(init?.headers, tenantHost);
  headers.set('Authorization', `Bearer ${accessToken}`);
  return { ...init, headers };
}

/**
 * Déclenche un refresh du token d'accès, dédupliqué avec tout refresh déjà
 * en cours (qu'il vienne du 401 réactif ci-dessous ou du refresh PROACTIF
 * planifié par tokenLifecycle.ts). Utilise l'apiBaseUrl/tenantHost fournis
 * à `installAuthFetchInterceptor` -- ne fait rien si appelé avant (ne
 * devrait jamais arriver en pratique : installé tout en haut de main.tsx).
 */
export function refreshAccessToken(): Promise<string | null> {
  if (!currentApiBaseUrl) return Promise.resolve(null);
  if (!refreshPromise) {
    const tenantHost = getTenantHeaderValueFn ? getTenantHeaderValueFn() : null;
    refreshPromise = performRefresh(currentApiBaseUrl, tenantHost).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * Installe l'intercepteur. Idempotent pour le remplacement de
 * `window.fetch` (un second appel ne le patche pas deux fois), mais
 * `apiBaseUrl`/`getTenantHeaderValue` sont toujours mémorisés (utilisés
 * par `refreshAccessToken` et, surtout, RE-APPELÉS à chaque requête —
 * voir plus bas — pour rester à jour même sans réinstallation).
 * `apiBaseUrl` doit être `env.apiBaseUrl` ; `getTenantHeaderValue` doit
 * être `store/tenants.store.ts::getTenantHeaderValue` (voir main.tsx).
 */
export function installAuthFetchInterceptor(apiBaseUrl: string, getTenantHeaderValue: () => string | null): void {
  currentApiBaseUrl = apiBaseUrl;
  getTenantHeaderValueFn = getTenantHeaderValue;

  if (installed || typeof window === 'undefined') return;
  installed = true;
  originalFetch = window.fetch.bind(window);
  const baseFetch = originalFetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const isOwn = isOwnApiRequest(input, apiBaseUrl);
    // Résolu ICI, à chaque requête -- pas une seule fois à l'installation
    // -- pour refléter immédiatement une activation/désactivation de
    // tenant faite entretemps par l'utilisateur (store/tenants.store.ts).
    const tenantHost = isOwn && getTenantHeaderValueFn ? getTenantHeaderValueFn() : null;
    const requestInit = isOwn ? { ...init, headers: withTenantHeader(init?.headers, tenantHost) } : init;

    const response = await baseFetch(input, requestInit);

    const eligible =
      response.status === 401 &&
      isOwn &&
      !isRefreshEndpoint(input) &&
      Boolean(tokenStore.getRefreshToken());

    if (!eligible) return response;

    const newAccessToken = await refreshAccessToken();
    if (!newAccessToken) return response; // refresh échoué -> on propage le 401 d'origine

    return baseFetch(input, withAuthorization(requestInit, newAccessToken, tenantHost));
  };
}
