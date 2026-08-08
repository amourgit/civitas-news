// ============================================================
// src/services/api/token/authFetchInterceptor.ts
// Refresh automatique et transparent du token sur une réponse 401.
//
// GetService/PostService/UpdateService/DeleteService appellent toutes
// `fetch()` directement, à de nombreux endroits (upload, batch,
// suppression douce, vérification de dépendances...). Plutôt que de
// dupliquer une logique de retry dans chacun de ces appels (risque de
// régression élevé sur du code déjà volumineux), on intercepte au
// niveau du navigateur : `window.fetch` est remplacé UNE SEULE FOIS,
// au démarrage de l'app (voir installAuthFetchInterceptor(), appelé
// depuis main.tsx), par une version qui sait rejouer silencieusement
// une requête après un refresh réussi. Tous les appels existants en
// bénéficient automatiquement, sans qu'aucun service n'ait à changer.
//
// Sans ceci, un access token expiré (durée de vie courte par design —
// TokenSettings.access_token_lifetime) ferait échouer en 401 la
// PROCHAINE requête de l'utilisateur, qui devrait alors se reconnecter
// manuellement même si sa session (refresh token) est encore valide.
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

async function performRefresh(apiBaseUrl: string): Promise<string | null> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken || !originalFetch) return null;

  try {
    const response = await originalFetch(`${apiBaseUrl}/token/v1/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

function withAuthorization(init: RequestInit | undefined, accessToken: string): RequestInit {
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  return { ...init, headers };
}

/**
 * Installe l'intercepteur. Idempotent — un second appel ne fait rien.
 * `apiBaseUrl` doit être la même valeur que `env.apiBaseUrl` (utilisée
 * par UrlBuilder pour construire les URLs relatives des services).
 */
export function installAuthFetchInterceptor(apiBaseUrl: string): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  originalFetch = window.fetch.bind(window);
  const baseFetch = originalFetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const response = await baseFetch(input, init);

    const eligible =
      response.status === 401 &&
      isOwnApiRequest(input, apiBaseUrl) &&
      !isRefreshEndpoint(input) &&
      Boolean(tokenStore.getRefreshToken());

    if (!eligible) return response;

    if (!refreshPromise) {
      refreshPromise = performRefresh(apiBaseUrl).finally(() => {
        refreshPromise = null;
      });
    }
    const newAccessToken = await refreshPromise;
    if (!newAccessToken) return response; // refresh échoué -> on propage le 401 d'origine

    return baseFetch(input, withAuthorization(init, newAccessToken));
  };
}
