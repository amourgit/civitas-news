import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Régression : avant tokenLifecycle.ts, un access token expiré ne se
 * révélait qu'au PROCHAIN échec 401 d'une vraie requête utilisateur
 * (refresh réactif, voir authFetchInterceptor.test.ts) -- rien ne se
 * passait avant ça, y compris dans la topbar. Ces tests vérifient le
 * refresh PROACTIF, planifié depuis le vrai `exp` du token.
 *
 * Note technique : même contrainte que authFetchInterceptor.test.ts --
 * installAuthFetchInterceptor/tokenLifecycle gardent un état de MODULE
 * (installed/started), donc chaque test repart d'un module frais via
 * `vi.resetModules()` + import dynamique dans le corps du test.
 */
describe('tokenLifecycle — refresh proactif', () => {
  const API_BASE_URL = 'https://api.test';

  function makeJwt(expiresInSeconds: number): string {
    const base64url = (obj: unknown) =>
      btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const header = base64url({ alg: 'none', typ: 'JWT' });
    const payload = base64url({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds });
    return `${header}.${payload}.signature`;
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    const { tokenStore } = await import('../tokenStore');
    const { stopTokenLifecycle } = await import('../tokenLifecycle');
    stopTokenLifecycle();
    tokenStore.clear();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('déclenche automatiquement un refresh avant expiration réelle (marge de sécurité)', async () => {
    const mockFetch = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).includes('/token/v1/refresh/')) {
        return new Response(JSON.stringify({ access: makeJwt(300), refresh: 'new-refresh' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', mockFetch);

    const { installAuthFetchInterceptor } = await import('../authFetchInterceptor');
    const { tokenStore } = await import('../tokenStore');
    const { startTokenLifecycle, getTokenLifecycleStatus } = await import('../tokenLifecycle');

    installAuthFetchInterceptor(API_BASE_URL, null);
    // Expire dans 90s, marge de sécurité de 60s -> refresh planifié à ~30s.
    tokenStore.setTokens({ access: makeJwt(90), refresh: 'initial-refresh' });
    startTokenLifecycle();

    expect(getTokenLifecycleStatus()).toBe('valid');
    expect(mockFetch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(31_000);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/token/v1/refresh/'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(tokenStore.getAccessToken()).not.toBeNull();
    expect(getTokenLifecycleStatus()).toBe('valid');
  });

  it('passe à "expired" (et vide la session) quand le refresh est réellement rejeté par le serveur', async () => {
    const mockFetch = vi.fn(async () => new Response('{}', { status: 401 }));
    vi.stubGlobal('fetch', mockFetch);

    const { installAuthFetchInterceptor } = await import('../authFetchInterceptor');
    const { tokenStore } = await import('../tokenStore');
    const { startTokenLifecycle, getTokenLifecycleStatus } = await import('../tokenLifecycle');

    installAuthFetchInterceptor(API_BASE_URL, null);
    // Expire dans 65s, marge de 60s -> refresh planifié à ~5s.
    tokenStore.setTokens({ access: makeJwt(65), refresh: 'initial-refresh' });
    startTokenLifecycle();

    await vi.advanceTimersByTimeAsync(6_000);

    expect(getTokenLifecycleStatus()).toBe('expired');
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(tokenStore.getRefreshToken()).toBeNull();
  });

  it('retente avec backoff sur un échec réseau transitoire, sans vider la session', async () => {
    let callCount = 0;
    const mockFetch = vi.fn(async () => {
      callCount += 1;
      if (callCount < 3) {
        throw new TypeError('network error');
      }
      return new Response(JSON.stringify({ access: makeJwt(300) }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    const { installAuthFetchInterceptor } = await import('../authFetchInterceptor');
    const { tokenStore } = await import('../tokenStore');
    const { startTokenLifecycle, getTokenLifecycleStatus } = await import('../tokenLifecycle');

    installAuthFetchInterceptor(API_BASE_URL, null);
    tokenStore.setTokens({ access: makeJwt(65), refresh: 'initial-refresh' });
    startTokenLifecycle();

    // 5s (planification) + 3s + 10s (délais de retry) + marge.
    await vi.advanceTimersByTimeAsync(20_000);

    expect(callCount).toBe(3);
    expect(tokenStore.getRefreshToken()).not.toBeNull();
    expect(getTokenLifecycleStatus()).toBe('valid');
  });

  it('startTokenLifecycle() est idempotent (un seul cycle réellement démarré)', async () => {
    const mockFetch = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', mockFetch);

    const { installAuthFetchInterceptor } = await import('../authFetchInterceptor');
    const { tokenStore } = await import('../tokenStore');
    const { startTokenLifecycle } = await import('../tokenLifecycle');

    installAuthFetchInterceptor(API_BASE_URL, null);
    tokenStore.setTokens({ access: makeJwt(300), refresh: 'r' });

    startTokenLifecycle();
    startTokenLifecycle();
    startTokenLifecycle();

    // Si chaque appel plantait son propre timer, on aurait 3 refresh
    // déclenchés à l'expiration au lieu d'un seul.
    await vi.advanceTimersByTimeAsync(241_000);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
