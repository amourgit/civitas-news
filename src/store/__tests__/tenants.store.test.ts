// ============================================================
// src/store/__tests__/tenants.store.test.ts
// tenants.store.ts garde un état de MODULE (comme tous les stores
// "maison" de ce dossier) -- entre deux tests, il faut donc à la fois
// vi.resetModules() ET ré-importer dynamiquement le module pour
// repartir d'un état frais (même contrainte que
// services/api/token/__tests__/authFetchInterceptor.test.ts).
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { TenantMembership } from '../../services/api/repositories/tenants.repository';

const { authState, listMineMock } = vi.hoisted(() => ({
  authState: { user: { id: 'user-1' }, isAuthenticated: true },
  listMineMock: vi.fn(),
}));

vi.mock('../auth.store', () => ({
  useAuthStore: () => authState,
}));

vi.mock('../../services/api/repositories/tenants.repository', () => ({
  tenantsRepository: { listMine: listMineMock },
}));

// Repli HISTORIQUE simulé (voir config/env.ts) -- une valeur fixe, comme
// si le navigateur affichait "civitasnews.vercel.app" (ou VITE_TENANT_HOST).
vi.mock('../../config/env', () => ({
  env: { tenantHost: 'civitasnews.vercel.app' },
}));

const TENANT_A: TenantMembership = {
  id: 1,
  name: 'Civitas',
  sousDomaine: 'civitas',
  domainHeaderValue: 'civitas',
  logo: null,
  role: 'administrateur',
  statutAdhesion: 'acceptee',
  isActive: true,
};
const TENANT_B: TenantMembership = {
  id: 2,
  name: 'Mon Campus',
  sousDomaine: 'moncampus',
  domainHeaderValue: 'moncampus',
  logo: null,
  role: 'etudiant',
  statutAdhesion: 'acceptee',
  isActive: true,
};

async function importFreshStore() {
  vi.resetModules();
  return import('../tenants.store');
}

describe('tenants.store', () => {
  beforeEach(() => {
    localStorage.clear();
    listMineMock.mockReset();
    authState.user = { id: 'user-1' };
    authState.isAuthenticated = true;
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("charge les tenants dont l'utilisateur est membre, sans rien activer par défaut", async () => {
    listMineMock.mockResolvedValue([TENANT_A, TENANT_B]);
    const { useTenantsStore } = await importFreshStore();

    const { result } = renderHook(() => useTenantsStore());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    expect(result.current.memberTenants).toEqual([TENANT_A, TENANT_B]);
    expect(result.current.activeTenants).toEqual([]);
  });

  it('active puis désactive des tenants, et met à jour la valeur CSV en temps réel', async () => {
    listMineMock.mockResolvedValue([TENANT_A, TENANT_B]);
    const { useTenantsStore, getActiveTenantHeaderValue } = await importFreshStore();

    const { result } = renderHook(() => useTenantsStore());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(getActiveTenantHeaderValue()).toBeNull();

    act(() => result.current.activate(1));
    expect(getActiveTenantHeaderValue()).toBe('civitas');

    act(() => result.current.activate(2));
    expect(getActiveTenantHeaderValue()).toBe('civitas,moncampus');

    act(() => result.current.deactivate(1));
    expect(getActiveTenantHeaderValue()).toBe('moncampus');
  });

  it("ignore l'activation d'un tenant dont l'utilisateur n'est PAS membre", async () => {
    listMineMock.mockResolvedValue([TENANT_A]);
    const { useTenantsStore } = await importFreshStore();

    const { result } = renderHook(() => useTenantsStore());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => result.current.activate(999));
    expect(result.current.activeTenants).toEqual([]);
  });

  it('persiste les tenants activés PAR UTILISATEUR et les restaure au remontage (ex: rechargement de page)', async () => {
    listMineMock.mockResolvedValue([TENANT_A, TENANT_B]);
    const { useTenantsStore } = await importFreshStore();

    const first = renderHook(() => useTenantsStore());
    await waitFor(() => expect(first.result.current.status).toBe('ready'));
    act(() => first.result.current.activate(2));
    first.unmount();

    const { useTenantsStore: useTenantsStoreAgain } = await importFreshStore();
    const second = renderHook(() => useTenantsStoreAgain());
    await waitFor(() => expect(second.result.current.status).toBe('ready'));

    expect(second.result.current.activeTenants.map((t) => t.id)).toEqual([2]);
  });

  it("retombe sur le repli historique (env.tenantHost) tant qu'aucun tenant n'est activé", async () => {
    listMineMock.mockResolvedValue([TENANT_A]);
    const { useTenantsStore, getTenantHeaderValue } = await importFreshStore();

    const { result } = renderHook(() => useTenantsStore());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(getTenantHeaderValue()).toBe('civitasnews.vercel.app');

    act(() => result.current.activate(1));
    expect(getTenantHeaderValue()).toBe('civitas');
  });

  it("réinitialise tout (pas de fuite entre comptes) quand l'utilisateur redevient anonyme", async () => {
    listMineMock.mockResolvedValue([TENANT_A]);
    const { useTenantsStore, getActiveTenantHeaderValue } = await importFreshStore();

    const { result, rerender } = renderHook(() => useTenantsStore());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    act(() => result.current.activate(1));

    authState.isAuthenticated = false;
    rerender();
    await waitFor(() => expect(result.current.status).toBe('idle'));

    expect(result.current.memberTenants).toEqual([]);
    expect(getActiveTenantHeaderValue()).toBeNull();
  });

  it("endpoint pas encore branché côté backend (échec) -> aucun crash, repli complet sur l'historique", async () => {
    listMineMock.mockRejectedValue(new Error('404 Not Found'));
    const { useTenantsStore, getTenantHeaderValue } = await importFreshStore();

    const { result } = renderHook(() => useTenantsStore());
    await waitFor(() => expect(result.current.status).toBe('error'));

    expect(result.current.memberTenants).toEqual([]);
    expect(getTenantHeaderValue()).toBe('civitasnews.vercel.app');
  });
});
