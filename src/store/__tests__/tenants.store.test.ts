// ============================================================
// src/store/__tests__/tenants.store.test.ts
// tenants.store.ts garde un état de MODULE (comme tous les stores
// "maison" de ce dossier) -- entre deux tests, il faut donc à la fois
// vi.resetModules() ET ré-importer dynamiquement le module pour
// repartir d'un état frais (même contrainte que
// services/api/token/__tests__/authFetchInterceptor.test.ts).
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TenantRef } from '../tenants.store';

// Repli HISTORIQUE simulé (voir config/env.ts) -- une valeur fixe, comme
// si le navigateur affichait "civitasnews.vercel.app" (ou VITE_TENANT_HOST).
vi.mock('../../config/env', () => ({
  env: { tenantHost: 'civitasnews.vercel.app' },
}));

const TENANT_A: TenantRef = { domainHeaderValue: 'civitas', name: 'Civitas' };
const TENANT_B: TenantRef = { domainHeaderValue: 'moncampus', name: 'Mon Campus' };

async function importFreshStore() {
  vi.resetModules();
  return import('../tenants.store');
}

describe('tenants.store', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("retombe sur le repli historique (env.tenantHost) tant qu'aucun tenant n'a été ouvert sur cet appareil", async () => {
    const { getTenantHeaderValue, getCurrentTenant } = await importFreshStore();

    expect(getTenantHeaderValue()).toBe('civitasnews.vercel.app');
    expect(getCurrentTenant()).toEqual({ domainHeaderValue: 'civitasnews.vercel.app', name: 'civitasnews.vercel.app' });
  });

  it('switchTenant remplace intégralement le tenant courant (jamais une addition)', async () => {
    const { switchTenant, getTenantHeaderValue, getCurrentTenant } = await importFreshStore();

    switchTenant(TENANT_A);
    expect(getTenantHeaderValue()).toBe('civitas');
    expect(getCurrentTenant()).toEqual(TENANT_A);

    switchTenant(TENANT_B);
    expect(getTenantHeaderValue()).toBe('moncampus');
    expect(getCurrentTenant()).toEqual(TENANT_B);
  });

  it('ne construit jamais une liste -- une seule valeur de tenant à la fois dans le header', async () => {
    const { switchTenant, getTenantHeaderValue } = await importFreshStore();

    switchTenant(TENANT_A);
    switchTenant(TENANT_B);

    const value = getTenantHeaderValue();
    expect(value).toBe('moncampus');
    expect(value).not.toContain(',');
  });

  it('mémorise les tenants ouverts localement pour le switch rapide, sans doublon, le plus récent en tête', async () => {
    const { switchTenant, getRecentTenants } = await importFreshStore();

    switchTenant(TENANT_A);
    switchTenant(TENANT_B);
    switchTenant(TENANT_A); // ré-ouvre A -> remonte en tête, pas de doublon

    expect(getRecentTenants()).toEqual([TENANT_A, TENANT_B]);
  });

  it('restaure le dernier tenant ouvert au remontage (ex: rechargement de page)', async () => {
    const { switchTenant } = await importFreshStore();
    switchTenant(TENANT_A);
    switchTenant(TENANT_B);

    const { getCurrentTenant, getRecentTenants } = await importFreshStore();
    expect(getCurrentTenant()).toEqual(TENANT_B);
    expect(getRecentTenants()).toEqual([TENANT_B, TENANT_A]);
  });

  it("la mémoire locale des tenants visités n'accorde aucun accès -- ce n'est qu'un raccourci de navigation", async () => {
    const { switchTenant, forgetRecentTenant, getRecentTenants, getCurrentTenant } = await importFreshStore();

    switchTenant(TENANT_A);
    switchTenant(TENANT_B);
    // Retirer un tenant de l'historique local ne fait qu'un ménage
    // d'UI : ça ne révoque rien côté backend, et si ce n'est pas le
    // tenant courant, currentTenant n'est même pas affecté.
    forgetRecentTenant(TENANT_A.domainHeaderValue);

    expect(getRecentTenants()).toEqual([TENANT_B]);
    expect(getCurrentTenant()).toEqual(TENANT_B);
  });

  it('useTenantsStore notifie les composants montés quand le tenant courant change', async () => {
    const { useTenantsStore, switchTenant } = await importFreshStore();
    const { result } = renderHook(() => useTenantsStore());

    expect(result.current.currentTenant?.domainHeaderValue).toBe('civitasnews.vercel.app');

    act(() => switchTenant(TENANT_A));
    expect(result.current.currentTenant).toEqual(TENANT_A);
    expect(result.current.recentTenants).toEqual([TENANT_A]);
  });
});

// ============================================================
// Réforme multi-tenant des GET : getTenantHeaderListValue combine le
// tenant COURANT et les tenants PUBLICS -- bien distincte de
// getTenantHeaderValue (singulier, testé ci-dessus), qui doit continuer
// à ne JAMAIS renvoyer de liste.
// ============================================================
describe('tenants.store — tenants publics (réforme multi-tenant des GET)', () => {
  const TENANT_PUBLIC_A: TenantRef = { domainHeaderValue: 'ministere-sante', name: 'Ministère de la Santé' };
  const TENANT_PUBLIC_B: TenantRef = { domainHeaderValue: 'mutuelle-x', name: 'Mutuelle X' };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('renvoie null quand ni tenant courant ni tenant public ne sont connus', async () => {
    vi.doMock('../../config/env', () => ({ env: { tenantHost: '' } }));
    const { getTenantHeaderListValue } = await importFreshStore();

    expect(getTenantHeaderListValue()).toBeNull();
  });

  it('combine le tenant courant et les tenants publics, tenant courant en tête', async () => {
    const { switchTenant, setPublicTenants, getTenantHeaderListValue } = await importFreshStore();

    switchTenant(TENANT_A);
    setPublicTenants([TENANT_PUBLIC_A, TENANT_PUBLIC_B]);

    expect(getTenantHeaderListValue()).toBe('civitas,ministere-sante,mutuelle-x');
  });

  it('déduplique un tenant public qui se trouve être aussi le tenant courant', async () => {
    const { switchTenant, setPublicTenants, getTenantHeaderListValue } = await importFreshStore();

    switchTenant(TENANT_PUBLIC_A);
    setPublicTenants([TENANT_PUBLIC_A, TENANT_PUBLIC_B]);

    expect(getTenantHeaderListValue()).toBe('ministere-sante,mutuelle-x');
  });

  it("n'affecte jamais getTenantHeaderValue (singulier) -- reste le tenant courant seul", async () => {
    const { switchTenant, setPublicTenants, getTenantHeaderValue, getTenantHeaderListValue } = await importFreshStore();

    switchTenant(TENANT_A);
    setPublicTenants([TENANT_PUBLIC_A, TENANT_PUBLIC_B]);

    expect(getTenantHeaderValue()).toBe('civitas');
    expect(getTenantHeaderValue()).not.toContain(',');
    expect(getTenantHeaderListValue()).toContain(',');
  });

  it('setPublicTenants persiste en localStorage et est restauré au remontage', async () => {
    const { setPublicTenants } = await importFreshStore();
    setPublicTenants([TENANT_PUBLIC_A, TENANT_PUBLIC_B]);

    const { getPublicTenants } = await importFreshStore();
    expect(getPublicTenants()).toEqual([TENANT_PUBLIC_A, TENANT_PUBLIC_B]);
  });

  it('setPublicTenants remplace intégralement la liste précédente (jamais un ajout)', async () => {
    const { setPublicTenants, getPublicTenants } = await importFreshStore();

    setPublicTenants([TENANT_PUBLIC_A, TENANT_PUBLIC_B]);
    setPublicTenants([TENANT_PUBLIC_A]);

    expect(getPublicTenants()).toEqual([TENANT_PUBLIC_A]);
  });
});
