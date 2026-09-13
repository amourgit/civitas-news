// ============================================================
// src/services/api/publicTenantsLifecycle.ts
// Réforme multi-tenant des GET : au démarrage, puis à intervalle
// régulier, on interroge GET /tenants/v1/publics/ (tenants
// is_public=true) et on met à jour store/tenants.store.ts::
// setPublicTenants -- c'est cette liste, combinée au tenant courant,
// que authFetchInterceptor.ts pose dans X-Tenant-Domain pour CHAQUE
// requête GET (voir store/tenants.store.ts::getTenantHeaderListValue).
//
// Pattern "lifecycle" identique à token/tokenLifecycle.ts (état de
// module + start/stop idempotents) -- volontairement plus simple ici :
// pas de backoff/retry élaboré, un rafraîchissement raté se rattrape
// simplement au prochain battement d'intervalle, la liste précédente
// (déjà en store + localStorage) restant valable entre-temps.
// ============================================================

import { tenantsRepository } from './repositories/tenants.repository';
import { setPublicTenants, type TenantRef } from '../../store/tenants.store';

// Les tenants publics (Ministères, Mutuelles...) sont déclarés par une
// action administrative explicite, pas quelque chose qui change d'une
// minute à l'autre -- 5 minutes absorbe l'essentiel du besoin de
// fraîcheur ("ou à intervalle de temps", explicitement demandé) sans
// bombarder le backend d'un annuaire qui bouge rarement.
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

let started = false;
let intervalTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Un seul appel réseau + mise à jour du store. Exportée séparément de
 * start() pour rester appelable isolément (ex: bouton "rafraîchir" côté
 * admin, ou test unitaire ciblé) sans dépendre du minuteur périodique.
 * Échec silencieux (log uniquement) : la liste précédente en cache
 * (store + localStorage) reste utilisée telle quelle, jamais vidée sur
 * un simple accroc réseau.
 */
export async function refreshPublicTenants(): Promise<void> {
  try {
    const tenants = await tenantsRepository.publicList();
    const refs: TenantRef[] = tenants
      .filter((tenant): tenant is typeof tenant & { domain: string } => Boolean(tenant.domain))
      .map((tenant) => ({ domainHeaderValue: tenant.domain, name: tenant.name }));
    setPublicTenants(refs);
  } catch (error) {
    console.warn('[publicTenantsLifecycle] Échec du rafraîchissement des tenants publics', error);
  }
}

/**
 * Démarre le rafraîchissement (immédiat, puis toutes les
 * REFRESH_INTERVAL_MS) -- idempotent, à appeler une fois depuis
 * main.tsx, indépendamment de tout état d'authentification : la liste
 * des tenants publics est utile même à un visiteur anonyme (routes
 * TENANT_PUBLIC en lecture, voir config/config.py côté backend).
 */
export function startPublicTenantsLifecycle(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  void refreshPublicTenants();
  intervalTimer = setInterval(() => void refreshPublicTenants(), REFRESH_INTERVAL_MS);
}

/** Arrête le minuteur -- utile en test pour repartir d'un état propre. */
export function stopPublicTenantsLifecycle(): void {
  started = false;
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
  }
}
