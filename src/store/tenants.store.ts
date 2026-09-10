// ============================================================
// src/store/tenants.store.ts
// Store des tenants — remplace la notion d'"un seul tenant fixe pour
// tout le déploiement" (voir config/tenantHost.ts / config/env.ts,
// conservés comme REPLI, jamais supprimés) par une liste explicite :
//
//  - memberTenants : tous les tenants dont l'utilisateur COURANT est
//    membre (adhesions.MembreTenant côté backend), qu'ils soient
//    activés ou non.
//  - tenants ACTIVÉS : sous-ensemble de memberTenants explicitement
//    choisi par l'utilisateur (persisté PAR UTILISATEUR en
//    localStorage) — ce sont eux, et EUX SEULS, que
//    getActiveTenantHeaderValue() expose pour l'en-tête
//    X-Tenant-Domain (voir services/api/token/authFetchInterceptor.ts).
//
// ⚠️ Contrat backend ATTENDU mais PAS ENCORE IMPLÉMENTÉ au moment
// d'écrire ce fichier (voir tenantsRepository.listMine et le
// commentaire de contrat dans tenants.repository.ts). Tant que
// GET /tenants/v1/mine/ n'existe pas côté backend, ensureMembershipLoaded
// échoue silencieusement (log console, memberTenants reste vide) et
// getTenantHeaderValue() retombe intégralement sur le mécanisme
// HISTORIQUE (env.tenantHost, un seul tenant) — ce fichier n'introduit
// donc AUCUNE régression tant que le backend n'est pas branché.
//
// Même pattern "store maison" que les autres stores de ce dossier
// (état de module + Set de listeners notifiés via useState/useEffect) —
// pas de lib externe (zustand/redux), voir auth.store.ts /
// notifications.store.ts.
// ============================================================

import { useEffect, useState } from 'react';
import { useAuthStore } from './auth.store';
import { tenantsRepository, type TenantMembership } from '../services/api/repositories/tenants.repository';
import { env } from '../config/env';

export type { TenantMembership };

export type MembershipStatus = 'idle' | 'loading' | 'ready' | 'error';

let memberTenants: TenantMembership[] = [];
let activeTenantIds: Set<number> = new Set();
let membershipStatus: MembershipStatus = 'idle';
// Utilisateur pour lequel memberTenants/activeTenantIds sont valides —
// évite de recharger à chaque rendu ET de garder la liste d'un ancien
// utilisateur affichée après un changement de compte sur le même poste.
let loadedForUserId: string | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((listener) => listener());
}

function storageKey(userId: string): string {
  return `civitas_active_tenants_${userId}`;
}

/** Ne restaure que les ids encore réellement membres (une adhésion a pu être retirée entretemps). */
function loadPersistedActiveIds(userId: string, tenants: TenantMembership[]): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    const validIds = new Set(tenants.map((t) => t.id));
    return new Set(parsed.filter((id): id is number => typeof id === 'number' && validIds.has(id)));
  } catch {
    return new Set();
  }
}

function persistActiveIds(userId: string, ids: Set<number>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(Array.from(ids)));
  } catch {
    // Stockage indisponible (navigation privée, quota) — l'activation
    // reste effective pour la session en cours, seulement non persistée.
  }
}

/** Charge (une seule fois par utilisateur, tant qu'on ne force pas via refresh()) la liste de ses adhésions. */
async function ensureMembershipLoaded(userId: string): Promise<void> {
  if (loadedForUserId === userId) return;
  loadedForUserId = userId;
  membershipStatus = 'loading';
  notify();
  try {
    memberTenants = await tenantsRepository.listMine();
    activeTenantIds = loadPersistedActiveIds(userId, memberTenants);
    membershipStatus = 'ready';
  } catch (error) {
    // Endpoint pas encore branché côté backend (voir en-tête de fichier)
    // OU erreur réseau réelle — dans les deux cas on retombe simplement
    // sur "aucun tenant activé", jamais un plantage de l'app.
    console.error('Échec du chargement de mes tenants:', error);
    memberTenants = [];
    activeTenantIds = new Set();
    membershipStatus = 'error';
  }
  notify();
}

function resetMembership(): void {
  loadedForUserId = null;
  memberTenants = [];
  activeTenantIds = new Set();
  membershipStatus = 'idle';
  notify();
}

/**
 * Valeur à poser dans l'en-tête X-Tenant-Domain, SANS dépendre de
 * React — appelée directement par authFetchInterceptor.ts (installé
 * hors de l'arbre de composants, voir main.tsx). CSV des tenants
 * ACTIVÉS s'il y en a au moins un, sinon `null` (voir
 * getTenantHeaderValue ci-dessous pour le repli).
 */
export function getActiveTenantHeaderValue(): string | null {
  if (activeTenantIds.size === 0) return null;
  const values = memberTenants.filter((t) => activeTenantIds.has(t.id)).map((t) => t.domainHeaderValue);
  return values.length > 0 ? values.join(',') : null;
}

/**
 * Composition complète à passer à installAuthFetchInterceptor (voir
 * main.tsx) : tenants activés (CSV) si l'utilisateur en a
 * explicitement choisi, SINON repli sur le mécanisme HISTORIQUE (un
 * seul tenant, sous-domaine du navigateur ou VITE_TENANT_HOST — voir
 * config/env.ts). Garantit qu'un visiteur anonyme ou un utilisateur
 * qui n'a encore rien activé continue de fonctionner EXACTEMENT comme
 * avant ce chantier.
 */
export function getTenantHeaderValue(): string | null {
  return getActiveTenantHeaderValue() ?? env.tenantHost;
}

export function useTenantsStore() {
  const { user, isAuthenticated } = useAuthStore();
  const [, forceRender] = useState(0);

  useEffect(() => {
    const handleChange = () => forceRender((n) => n + 1);
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void ensureMembershipLoaded(user.id);
    } else {
      resetMembership();
    }
  }, [isAuthenticated, user.id]);

  const activeTenants = memberTenants.filter((t) => activeTenantIds.has(t.id));

  const isActive = (tenantId: number): boolean => activeTenantIds.has(tenantId);

  const activate = (tenantId: number): void => {
    if (!isAuthenticated) return;
    if (!memberTenants.some((t) => t.id === tenantId) || activeTenantIds.has(tenantId)) return;
    activeTenantIds = new Set(activeTenantIds).add(tenantId);
    persistActiveIds(user.id, activeTenantIds);
    notify();
  };

  const deactivate = (tenantId: number): void => {
    if (!isAuthenticated || !activeTenantIds.has(tenantId)) return;
    const next = new Set(activeTenantIds);
    next.delete(tenantId);
    activeTenantIds = next;
    persistActiveIds(user.id, activeTenantIds);
    notify();
  };

  const toggle = (tenantId: number): void => {
    if (activeTenantIds.has(tenantId)) deactivate(tenantId);
    else activate(tenantId);
  };

  /** Force un rechargement (ex: après acceptation d'une nouvelle adhésion pendant la session). */
  const refresh = (): Promise<void> => {
    loadedForUserId = null;
    return ensureMembershipLoaded(user.id);
  };

  return {
    status: membershipStatus,
    isLoading: membershipStatus === 'loading',
    memberTenants,
    activeTenants,
    isActive,
    activate,
    deactivate,
    toggle,
    refresh,
  };
}
