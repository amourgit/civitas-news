// ============================================================
// src/store/tenants.store.ts
// Store du tenant COURANT — une session applicative travaille TOUJOURS
// dans un seul tenant à la fois (voir tenants/middleware.py côté
// backend, qui résout un seul tenant par requête depuis
// X-Tenant-Domain / Host). Il n'existe plus de notion de "tenants
// actifs" multiples : ce fichier remplace intégralement l'ancienne
// version qui posait une liste CSV de tenants activés dans l'en-tête.
//
// Chaque tenant a ses propres utilisateurs et sa propre authentification
// (schema Postgres dédié, users.User local — voir users/models.py,
// token_manager/api/v1/views.py côté backend). Il n'existe AUCUNE
// identité globale reliant les comptes de deux tenants entre eux :
// changer de tenant, c'est changer de contexte d'authentification, pas
// choisir dans une liste de "mes organisations" adossée à un compte
// global. Voir switchTenant() ci-dessous.
//
// Deux notions bien séparées :
//  - currentTenant : LE tenant dans lequel la session travaille en ce
//    moment. C'est lui, et lui seul, qui alimente l'en-tête
//    X-Tenant-Domain (voir getTenantHeaderValue, consommé par
//    services/api/token/authFetchInterceptor.ts).
//  - recentTenants : simple historique LOCAL (localStorage, propre à cet
//    appareil/navigateur) des tenants déjà ouverts, pour proposer un
//    switch rapide dans l'UI. N'accorde AUCUN accès : ce n'est qu'un
//    raccourci de navigation. La présence d'un tenant dans cet
//    historique ne prouve rien côté sécurité — l'authentification (et
//    donc l'autorisation) reste entièrement à la charge du backend au
//    moment où l'on rebascule dessus. Voir switchTenant().
//
// Pattern "store maison" identique aux autres stores de ce dossier
// (état de module + Set de listeners notifiés via useState/useEffect) —
// voir auth.store.ts / notifications.store.ts.
// ============================================================

import { useEffect, useState } from 'react';
import { env } from '../config/env';

/**
 * Un tenant tel que connu du frontend — juste assez d'informations pour
 * réafficher un sélecteur de switch rapide et reconstruire l'en-tête
 * X-Tenant-Domain. `domainHeaderValue` est la valeur EXACTE à poser
 * dans cet en-tête (sous-domaine ou domaine explicitement enregistré
 * côté backend, voir domain.Domain) — ne jamais tenter de la
 * recalculer ailleurs à partir d'un autre champ.
 */
export interface TenantRef {
  domainHeaderValue: string;
  name: string;
}

const RECENT_TENANTS_STORAGE_KEY = 'civitas_recent_tenants';
const MAX_RECENT_TENANTS = 8;

let currentTenant: TenantRef | null = null;
let recentTenants: TenantRef[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function isTenantRef(value: unknown): value is TenantRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as TenantRef).domainHeaderValue === 'string' &&
    typeof (value as TenantRef).name === 'string'
  );
}

function readRecentTenants(): TenantRef[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_TENANTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTenantRef);
  } catch {
    return [];
  }
}

function persistRecentTenants(tenants: TenantRef[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RECENT_TENANTS_STORAGE_KEY, JSON.stringify(tenants));
  } catch {
    // Stockage indisponible (navigation privée, quota) — le switch
    // rapide est simplement absent cette session, sans impact
    // fonctionnel sur le tenant courant lui-même.
  }
}

/**
 * Initialise currentTenant au tout premier accès : le tenant le plus
 * récemment ouvert sur cet appareil, sinon repli sur le mécanisme
 * historique (sous-domaine affiché par le navigateur, ou
 * VITE_TENANT_HOST pour un déploiement figé sur un tenant précis — voir
 * config/env.ts / config/tenantHost.ts).
 *
 * Ce n'est qu'une VALEUR DE DÉPART, jamais une constante figée pour
 * toute la session : dès que switchTenant() est appelé, currentTenant
 * change et toutes les requêtes suivantes utilisent la nouvelle valeur.
 */
function ensureHydrated(): void {
  if (hydrated) return;
  hydrated = true;
  recentTenants = readRecentTenants();
  if (recentTenants.length > 0) {
    currentTenant = recentTenants[0];
  } else if (env.tenantHost) {
    currentTenant = { domainHeaderValue: env.tenantHost, name: env.tenantHost };
  } else {
    currentTenant = null;
  }
}

/**
 * Valeur à poser dans l'en-tête X-Tenant-Domain pour la requête EN
 * COURS — appelée par authFetchInterceptor.ts À CHAQUE fetch, jamais
 * mémorisée une seule fois. `null` = aucun tenant courant connu ; le
 * backend retombe alors sur la résolution par Host HTTP standard.
 */
export function getTenantHeaderValue(): string | null {
  ensureHydrated();
  return currentTenant?.domainHeaderValue ?? null;
}

export function getCurrentTenant(): TenantRef | null {
  ensureHydrated();
  return currentTenant;
}

export function getRecentTenants(): TenantRef[] {
  ensureHydrated();
  return recentTenants;
}

/**
 * Bascule la session sur un AUTRE tenant. Remplace intégralement le
 * contexte courant — jamais d'ajout à une liste de tenants actifs, voir
 * l'en-tête de ce fichier — et enregistre ce tenant dans l'historique
 * local de switch rapide (dédupliqué, le plus récent en tête).
 *
 * N'authentifie PAS : chaque tenant ayant ses propres comptes
 * utilisateur, la session d'authentification du tenant précédent n'a
 * aucun sens dans le nouveau. C'est à l'appelant (l'écran de switch)
 * de déclencher ensuite authStore.logout() puis, si nécessaire, un
 * nouveau login dans le tenant cible.
 */
export function switchTenant(tenant: TenantRef): void {
  ensureHydrated();
  currentTenant = tenant;
  const withoutDuplicate = recentTenants.filter((t) => t.domainHeaderValue !== tenant.domainHeaderValue);
  recentTenants = [tenant, ...withoutDuplicate].slice(0, MAX_RECENT_TENANTS);
  persistRecentTenants(recentTenants);
  notify();
}

/**
 * Retire un tenant de l'historique local de switch rapide (ex: devenu
 * invalide, ou nettoyage explicite demandé par l'utilisateur). N'a
 * aucun effet sur currentTenant si ce n'est pas le tenant retiré —
 * conforme à la règle "le stockage local n'est jamais une preuve
 * d'autorisation" : le supprimer ne révoque rien côté backend, il
 * disparaît juste du sélecteur de switch rapide.
 */
export function forgetRecentTenant(domainHeaderValue: string): void {
  ensureHydrated();
  recentTenants = recentTenants.filter((t) => t.domainHeaderValue !== domainHeaderValue);
  if (currentTenant?.domainHeaderValue === domainHeaderValue) {
    currentTenant = recentTenants[0] ?? null;
  }
  persistRecentTenants(recentTenants);
  notify();
}

export function useTenantsStore() {
  ensureHydrated();
  const [, forceRender] = useState(0);

  useEffect(() => {
    const handleChange = () => forceRender((n) => n + 1);
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  return {
    currentTenant,
    recentTenants,
    switchTenant,
    forgetRecentTenant,
  };
}
