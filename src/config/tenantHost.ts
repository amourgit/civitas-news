// ============================================================
// src/config/tenantHost.ts
// Capture du sous-domaine tenant depuis l'URL COURANTE du navigateur
// (window.location), plutôt qu'une valeur fixée une fois pour toutes
// dans une variable d'environnement au moment du build.
//
// C'est la pièce manquante identifiée : le frontend ne relayait
// jusqu'ici jamais le sous-domaine réellement affiché dans la barre
// d'adresse (ex: "civitas.localhost") vers le backend -- soit parce
// que l'URL de base de l'API était un chemin relatif '/api' (qui hérite
// silencieusement de l'origine COURANTE, mais échoue dès que
// frontend et backend ne sont pas sur le même port -- Vite sur :3000,
// Django sur :8000, deux origines distinctes en dev), soit parce
// qu'elle était fixée en dur via VITE_API_BASE_URL, indépendamment de
// ce que l'utilisateur affichait réellement dans son navigateur.
// ============================================================

/**
 * Hostname courant SANS le port (ex: "civitas.localhost"), ou null hors
 * navigateur (rendu serveur / tests). Comparable directement au champ
 * `Domain.domain` côté backend (voir tenants/models.py, domain/models.py).
 */
export function getCurrentTenantHost(): string | null {
  if (typeof window === 'undefined' || !window.location) return null;
  return window.location.hostname.toLowerCase();
}

/** Protocole courant ("http:" / "https:"), ou "http:" par défaut hors navigateur. */
export function getCurrentProtocol(): string {
  if (typeof window === 'undefined' || !window.location) return 'http:';
  return window.location.protocol;
}
