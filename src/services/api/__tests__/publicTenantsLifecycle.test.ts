import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Régression production : le tout premier GET de la session (tiré
 * quasi immédiatement après createRoot(...).render() dans main.tsx, voir
 * authFetchInterceptor.ts) partait systématiquement sans aucun tenant
 * public dans X-Tenant-Domain -- même une fois `Tenant.is_public`
 * réellement peuplé côté backend -- car la liste (state du module
 * tenants.store.ts) n'était mise à jour qu'APRÈS la résolution du
 * premier appel réseau, jamais attendue par personne.
 * waitForFirstPublicTenantsRefresh() comble cette fenêtre ; ces tests
 * vérifient qu'elle attend réellement CE premier appel, et qu'elle ne
 * bloque jamais indéfiniment derrière un backend lent (cold start Render).
 */
describe('publicTenantsLifecycle — readiness gate du premier rafraîchissement', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    const { stopPublicTenantsLifecycle } = await import('../publicTenantsLifecycle');
    stopPublicTenantsLifecycle();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    localStorage.clear();
    vi.resetModules();
  });

  it("résout immédiatement si le cycle n'a jamais été démarré", async () => {
    const { waitForFirstPublicTenantsRefresh } = await import('../publicTenantsLifecycle');
    await expect(waitForFirstPublicTenantsRefresh()).resolves.toBeUndefined();
  });

  it('attend la fin du tout premier appel réseau avant de résoudre, puis reflète le résultat en store', async () => {
    let resolveFetch!: (value: Response) => void;
    mockFetch = vi.fn(() => new Promise<Response>((resolve) => { resolveFetch = resolve; }));
    vi.stubGlobal('fetch', mockFetch);

    const { startPublicTenantsLifecycle, waitForFirstPublicTenantsRefresh } = await import('../publicTenantsLifecycle');
    const { getPublicTenants } = await import('../../../store/tenants.store');

    startPublicTenantsLifecycle();
    let ready = false;
    const waiting = waitForFirstPublicTenantsRefresh().then(() => {
      ready = true;
    });

    // Le réseau n'a pas encore répondu -- toujours en attente.
    await Promise.resolve();
    expect(ready).toBe(false);

    resolveFetch(
      new Response(
        JSON.stringify([
          { id: 1, name: 'Ministère de la Santé', sousDomaine: 'ministere-sante', domain: 'ministere-sante.example', isPublic: true },
        ]),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    await waiting;

    expect(ready).toBe(true);
    expect(getPublicTenants()).toEqual([{ domainHeaderValue: 'ministere-sante.example', name: 'Ministère de la Santé' }]);
  });

  it('ne bloque JAMAIS indéfiniment -- se résout après READY_TIMEOUT_MS même si le réseau ne répond jamais', async () => {
    mockFetch = vi.fn(() => new Promise<Response>(() => {})); // ne se résout jamais (simule un cold start qui traîne)
    vi.stubGlobal('fetch', mockFetch);

    const { startPublicTenantsLifecycle, waitForFirstPublicTenantsRefresh } = await import('../publicTenantsLifecycle');

    startPublicTenantsLifecycle();
    let ready = false;
    const waiting = waitForFirstPublicTenantsRefresh().then(() => {
      ready = true;
    });

    await vi.advanceTimersByTimeAsync(3000);
    await waiting;

    expect(ready).toBe(true);
  });
});
