// ============================================================
// src/services/api/token/tokenStore.ts
// Source unique de vérité pour les tokens JWT (access/refresh) côté
// client. Remplace les lectures `localStorage.getItem('...')`
// dispersées dans l'ancien code (api.client.ts, etc.).
//
// Le backend (token_manager) émet un couple { access, refresh } —
// voir Backend-Core-Base/token_manager/api/v1/views.py.
// ============================================================

const ACCESS_TOKEN_KEY = 'civitas_access_token';
const REFRESH_TOKEN_KEY = 'civitas_refresh_token';

type TokenListener = (accessToken: string | null) => void;

const listeners = new Set<TokenListener>();

// Cache mémoire pour éviter de repasser par localStorage à chaque requête.
let accessTokenCache: string | null | undefined = undefined;
let refreshTokenCache: string | null | undefined = undefined;

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Stockage indisponible (mode privé, quota...) — on continue en mémoire uniquement.
  }
}

function notify(accessToken: string | null): void {
  listeners.forEach((listener) => listener(accessToken));
}

export const tokenStore = {
  getAccessToken(): string | null {
    if (accessTokenCache === undefined) {
      accessTokenCache = readStorage(ACCESS_TOKEN_KEY);
    }
    return accessTokenCache;
  },

  getRefreshToken(): string | null {
    if (refreshTokenCache === undefined) {
      refreshTokenCache = readStorage(REFRESH_TOKEN_KEY);
    }
    return refreshTokenCache;
  },

  setTokens(tokens: { access: string; refresh?: string }): void {
    accessTokenCache = tokens.access;
    writeStorage(ACCESS_TOKEN_KEY, tokens.access);

    if (tokens.refresh) {
      refreshTokenCache = tokens.refresh;
      writeStorage(REFRESH_TOKEN_KEY, tokens.refresh);
    }

    notify(tokens.access);
  },

  clear(): void {
    accessTokenCache = null;
    refreshTokenCache = null;
    writeStorage(ACCESS_TOKEN_KEY, null);
    writeStorage(REFRESH_TOKEN_KEY, null);
    notify(null);
  },

  isAuthenticated(): boolean {
    return Boolean(tokenStore.getAccessToken());
  },

  /** S'abonner aux changements de token (ex: pour réagir à une déconnexion globale). */
  subscribe(listener: TokenListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export type TokenStore = typeof tokenStore;
