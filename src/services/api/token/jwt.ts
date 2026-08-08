// ============================================================
// src/services/api/token/jwt.ts
// Lecture (PAS vérification) du payload d'un JWT côté client.
//
// La signature n'est JAMAIS vérifiée ici — ce serait un non-sens sans
// la clé secrète, qui ne doit jamais quitter le serveur. Ce module sert
// uniquement à lire `exp` pour deux usages non sensibles :
//  - calculer une durée de vie de cookie cohérente avec la vraie
//    expiration du token (plutôt qu'une valeur arbitraire) ;
//  - déclencher un refresh PROACTIF avant expiration (voir
//    BaseHttpService), en plus du refresh RÉACTIF sur 401.
// Le backend reste seul juge de la validité réelle d'un token.
// ============================================================

interface JwtPayload {
  exp?: number; // secondes Unix
  [key: string]: unknown;
}

function base64UrlDecode(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  try {
    return decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
  } catch {
    return atob(padded);
  }
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as JwtPayload;
  } catch {
    return null;
  }
}

/** Timestamp d'expiration en millisecondes, ou null si illisible. */
export function getJwtExpiryMs(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
}

/** Secondes restantes avant expiration (0 si déjà expiré ou illisible). */
export function getJwtRemainingSeconds(token: string): number {
  const expiryMs = getJwtExpiryMs(token);
  if (expiryMs === null) return 0;
  return Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
}
