// ============================================================
// src/services/api/token/cookies.ts
// Utilitaire cookies minimal (aucune dépendance externe — js-cookie
// n'est pas dans package.json, un wrapper natif suffit pour ce besoin).
//
// Ce ne sont PAS des cookies HttpOnly : un cookie HttpOnly ne peut être
// posé que par le serveur via un en-tête `Set-Cookie`, or le backend
// (token_manager) renvoie access/refresh dans le CORPS JSON de la
// réponse, pas via Set-Cookie — les poser en HttpOnly demanderait un
// changement d'architecture backend plus large. Ce sont donc des
// cookies lisibles en JS (comme le localStorage qu'ils remplacent),
// mais avec deux avantages concrets que localStorage n'offre pas :
// une expiration NATIVE gérée par le navigateur (`max-age`, calculée
// depuis le vrai `exp` du JWT — voir jwt.ts) et un `SameSite=Lax` qui
// limite leur envoi aux navigations same-site.
// ============================================================

function isHttps(): boolean {
  return typeof window !== 'undefined' && window.location.protocol === 'https:';
}

export function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === 'undefined') return;
  const secure = isHttps() ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${Math.max(1, Math.floor(maxAgeSeconds))}; SameSite=Lax${secure}`;
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const match = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(prefix));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(prefix.length));
  } catch {
    return match.slice(prefix.length);
  }
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  const secure = isHttps() ? '; Secure' : '';
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${secure}`;
}
