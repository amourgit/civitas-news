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
//  2. En-tête X-Tenant-Domain sur chaque requête vers notre API,
//     portant le hostname RÉELLEMENT affiché dans le navigateur (voir
//     config/tenantHost.ts). Mécanisme alternatif au sous-domaine
//     porté par le Host HTTP standard — le backend
//     (config/fonction.py:resolve_request_hostname) le préfère quand
//     présent. Utile même quand apiBaseUrl cible une origine fixe
//     (VITE_API_BASE_URL explicite) : dans ce cas le Host effectivement
//     reçu par Django serait celui de cette URL fixe, pas celui du
//     navigateur — l'en-tête reste alors la seule façon fiable de
//     faire remonter le vrai sous-domaine tenant.
//
// `window.fetch` est remplacé UNE SEULE FOIS, au démarrage de l'app
// (voir installAuthFetchInterceptor(), appelé depuis main.tsx).
// ============================================================

import { tokenStore } from './tokenStore';

let installed = false;
let originalFetch: typeof window.fetch | null = null;

// Dédupliqué entre appels concurrents : si 3 requêtes échouent en 401
// en même temps, un seul refresh est déclenché, les 3 l'attendent.
let refreshPromise: Promise<string | null> | null = null;

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
  if (!refreshToken || !originalFetch) return null;

  try {
    const response = await originalFetch(`${apiBaseUrl}/token/v1/refresh/`, {
      method: 'POST',
      headers: withTenantHeader({ 'Content-Type': 'application/json' }, tenantHost),
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!response.ok) {
      tokenStore.clear();
      return null;
    }
    const data = (await response.json()) as { access?: string; refresh?: string };
    if (!data.access) {
      tokenStore.clear();
      return null;
    }
    tokenStore.setTokens({ access: data.access, refresh: data.refresh });
    return data.access;
  } catch {
    // Erreur réseau pendant le refresh : on ne vide PAS la session
    // (elle est peut-être encore valide, c'est juste le réseau qui a
    // un problème passager) — on échoue juste cette tentative.
    return null;
  }
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
 * Installe l'intercepteur. Idempotent — un second appel ne fait rien.
 * `apiBaseUrl`/`tenantHost` doivent être `env.apiBaseUrl`/`env.tenantHost`.
 */
export function installAuthFetchInterceptor(apiBaseUrl: string, tenantHost: string | null): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  originalFetch = window.fetch.bind(window);
  const baseFetch = originalFetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const isOwn = isOwnApiRequest(input, apiBaseUrl);
    const requestInit = isOwn ? { ...init, headers: withTenantHeader(init?.headers, tenantHost) } : init;

    const response = await baseFetch(input, requestInit);

    const eligible =
      response.status === 401 &&
      isOwn &&
      !isRefreshEndpoint(input) &&
      Boolean(tokenStore.getRefreshToken());

    if (!eligible) return response;

    if (!refreshPromise) {
      refreshPromise = performRefresh(apiBaseUrl, tenantHost).finally(() => {
        refreshPromise = null;
      });
    }
    const newAccessToken = await refreshPromise;
    if (!newAccessToken) return response; // refresh échoué -> on propage le 401 d'origine

    return baseFetch(input, withAuthorization(requestInit, newAccessToken, tenantHost));
  };
}
