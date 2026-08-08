// ============================================================
// src/services/api/token/tokenStore.ts
// Source unique de vérité pour les tokens JWT (access/refresh) côté
// client. Remplace les lectures `localStorage.getItem('...')`
// dispersées dans l'ancien code (api.client.ts, etc.).
//
// Le backend (token_manager) émet un couple { access, refresh } —
// voir Backend-Core-Base/token_manager/api/v1/views.py.
//
// Stockage : cookies (voir cookies.ts pour le pourquoi), avec une
// durée de vie calculée depuis le vrai `exp` de chaque JWT (jwt.ts) —
// pas une valeur arbitraire côté client qui pourrait diverger de la
// config réelle (TokenSettings.access_token_lifetime /
// refresh_token_lifetime, modifiable côté backend sans redéploiement
// frontend).
// ============================================================

import { getCookie, setCookie, deleteCookie } from './cookies';
import { getJwtRemainingSeconds } from './jwt';

const ACCESS_TOKEN_KEY = 'civitas_access_token';
const REFRESH_TOKEN_KEY = 'civitas_refresh_token';

// Filet de sécurité si le JWT est illisible (ne devrait pas arriver en
// pratique) : mieux vaut une expiration courte-mais-fonctionnelle qu'un
// cookie sans max-age qui redeviendrait un cookie de session classique.
const FALLBACK_ACCESS_TTL_SECONDS = 5 * 60;
const FALLBACK_REFRESH_TTL_SECONDS = 24 * 60 * 60;

type TokenListener = (accessToken: string | null) => void;

const listeners = new Set<TokenListener>();

// Cache mémoire pour éviter de reparser document.cookie à chaque requête.
let accessTokenCache: string | null | undefined = undefined;
let refreshTokenCache: string | null | undefined = undefined;

function notify(accessToken: string | null): void {
  listeners.forEach((listener) => listener(accessToken));
}

export const tokenStore = {
  getAccessToken(): string | null {
    if (accessTokenCache === undefined) {
      accessTokenCache = getCookie(ACCESS_TOKEN_KEY);
    }
    return accessTokenCache;
  },

  getRefreshToken(): string | null {
    if (refreshTokenCache === undefined) {
      refreshTokenCache = getCookie(REFRESH_TOKEN_KEY);
    }
    return refreshTokenCache;
  },

  setTokens(tokens: { access: string; refresh?: string }): void {
    accessTokenCache = tokens.access;
    const accessTtl = getJwtRemainingSeconds(tokens.access) || FALLBACK_ACCESS_TTL_SECONDS;
    setCookie(ACCESS_TOKEN_KEY, tokens.access, accessTtl);

    if (tokens.refresh) {
      refreshTokenCache = tokens.refresh;
      const refreshTtl = getJwtRemainingSeconds(tokens.refresh) || FALLBACK_REFRESH_TTL_SECONDS;
      setCookie(REFRESH_TOKEN_KEY, tokens.refresh, refreshTtl);
    }

    notify(tokens.access);
  },

  clear(): void {
    accessTokenCache = null;
    refreshTokenCache = null;
    deleteCookie(ACCESS_TOKEN_KEY);
    deleteCookie(REFRESH_TOKEN_KEY);
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
