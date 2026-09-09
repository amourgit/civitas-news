// ============================================================
// src/services/api/token/tokenLifecycle.ts
// Jusqu'ici, un access token expiré ne se manifestait qu'au PROCHAIN
// échec 401 d'une vraie requête utilisateur (refresh RÉACTIF, voir
// authFetchInterceptor.ts) : entre l'expiration réelle et cette
// prochaine requête, rien ne se passait -- silence total, y compris
// dans la topbar, qui n'avait aucune idée qu'un renouvellement venait
// d'avoir lieu ou que la session était sur le point de se terminer.
//
// Ce module ajoute un refresh PROACTIF, planifié depuis le vrai `exp`
// du token (jwt.ts) avec une marge de sécurité, plutôt que d'attendre
// un échec. Il expose aussi un statut observable pour que l'UI (la
// topbar en particulier, montée en permanence sur toute l'app) puisse
// réagir en direct.
// ============================================================

import { tokenStore } from './tokenStore';
import { getJwtExpiryMs } from './jwt';
import { refreshAccessToken } from './authFetchInterceptor';

export type TokenLifecycleStatus = 'idle' | 'valid' | 'refreshing' | 'expired';

// Marge de sécurité avant l'expiration réelle -- couvre la latence
// réseau du refresh lui-même et une éventuelle dérive d'horloge client.
const REFRESH_SAFETY_MARGIN_MS = 60_000;

// Filet si le refresh proactif échoue pour une raison transitoire
// (réseau, pas un vrai rejet serveur) : nouvelles tentatives rapprochées
// plutôt que d'attendre le prochain cycle complet (potentiellement très
// loin si le token venait tout juste d'être renouvelé pour longtemps).
const RETRY_DELAYS_MS = [3_000, 10_000];

// Filet ultime : même si le timer calculé depuis `exp` dérive (mise en
// veille de l'appareil, onglet en arrière-plan throttlé par le
// navigateur...), un battement périodique revérifie l'état réel.
const HEARTBEAT_INTERVAL_MS = 30_000;

let status: TokenLifecycleStatus = 'idle';
let scheduledTimer: ReturnType<typeof setTimeout> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let started = false;
const listeners = new Set<(status: TokenLifecycleStatus) => void>();

function setStatus(next: TokenLifecycleStatus): void {
  if (status === next) return;
  status = next;
  listeners.forEach((listener) => listener(status));
}

function clearScheduledTimer(): void {
  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
}

async function refreshWithRetry(attempt = 0): Promise<void> {
  setStatus('refreshing');
  const newAccessToken = await refreshAccessToken();

  if (newAccessToken) {
    // tokenStore.setTokens (appelé à l'intérieur de refreshAccessToken)
    // a déjà notifié tokenStore.subscribe ci-dessous, qui replanifie
    // depuis le nouveau token -- rien à faire de plus ici.
    return;
  }

  // Un refresh REJETÉ par le serveur (token invalide/expiré côté
  // backend) vide déjà tokenStore à l'intérieur de performRefresh --
  // getRefreshToken() redevient donc null dans ce cas précis. Ça permet
  // de distinguer "session terminée pour de bon" d'un simple accroc
  // réseau passager (où le refresh token, lui, est probablement encore
  // valide et mérite une nouvelle tentative).
  if (!tokenStore.getRefreshToken()) {
    setStatus('expired');
    return;
  }

  if (attempt < RETRY_DELAYS_MS.length) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
    return refreshWithRetry(attempt + 1);
  }

  // Abandon pour ce cycle précis -- le prochain battement (heartbeat)
  // ou la prochaine requête utilisateur (refresh réactif sur 401)
  // reprendra la main ; pas de blocage indéfini sur un réseau capricieux.
  setStatus('valid');
}

function scheduleFromCurrentToken(): void {
  clearScheduledTimer();

  const accessToken = tokenStore.getAccessToken();
  if (!accessToken) {
    setStatus('idle');
    return;
  }

  const expiryMs = getJwtExpiryMs(accessToken);
  if (expiryMs === null) {
    // Token illisible : filet de sécurité, on se repose sur le prochain
    // battement plutôt que de ne jamais rien planifier du tout.
    setStatus('valid');
    return;
  }

  const delay = expiryMs - Date.now() - REFRESH_SAFETY_MARGIN_MS;

  if (delay <= 0) {
    void refreshWithRetry();
    return;
  }

  setStatus('valid');
  scheduledTimer = setTimeout(() => void refreshWithRetry(), delay);
}

function heartbeat(): void {
  // Le timer planifié couvre déjà le cas nominal ; ce battement rattrape
  // uniquement les dérives (setTimeout retardé par une mise en veille,
  // un onglet en arrière-plan throttlé...). On ne s'en mêle pas pendant
  // qu'un refresh est déjà en cours.
  if (status === 'refreshing') return;
  scheduleFromCurrentToken();
}

/**
 * Démarre le gestionnaire de cycle de vie du token. Idempotent -- prévu
 * pour être appelé depuis chaque montage de useAuthStore() (et donc, en
 * pratique, dès que la topbar est montée -- elle l'est en permanence sur
 * toute l'app). Un second appel (autre composant, remontage) ne fait rien.
 */
export function startTokenLifecycle(): void {
  if (started || typeof window === 'undefined') return;
  started = true;

  tokenStore.subscribe(() => scheduleFromCurrentToken());
  heartbeatTimer = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);
  scheduleFromCurrentToken();
}

/** Arrête tout timer -- utile en test pour repartir d'un état propre. */
export function stopTokenLifecycle(): void {
  started = false;
  clearScheduledTimer();
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  status = 'idle';
}

export function getTokenLifecycleStatus(): TokenLifecycleStatus {
  return status;
}

export function subscribeToTokenLifecycle(listener: (status: TokenLifecycleStatus) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
