import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GetService } from '../../GetService';
import { tokenStore } from '../tokenStore';

/**
 * Régression production : le backend (tenants/middleware.py) résout le
 * tenant en tentant EN PARALLÈLE le sous-domaine (Host) et l'en-tête
 * X-Tenant-Domain. Sur Render (plan gratuit), le Host vu par Django est
 * TOUJOURS le domaine racine du service (pas de certificat TLS valide
 * pour les sous-domaines de *.onrender.com) -- l'en-tête est donc
 * l'UNIQUE façon fiable de faire remonter le tenant réel en production.
 * Ce test vérifie qu'il est bien posé, à la base, sur CHAQUE requête
 * vers notre API -- pas seulement certaines.
 *
 * Note technique : installAuthFetchInterceptor REMPLACE `window.fetch`
 * par son propre wrapper (pas un vi.fn) -- on garde donc une référence
 * au mock stubbé par `vi.stubGlobal` (capturé par l'intercepteur comme
 * son `originalFetch`/`baseFetch`) AVANT d'appeler `install(...)`, et
 * c'est CE mock qu'on inspecte ensuite, pas le `fetch` global courant
 * (qui pointe désormais vers le wrapper de l'intercepteur, sans `.mock`).
 */
describe('installAuthFetchInterceptor — en-tête X-Tenant-Domain', () => {
  const API_BASE_URL = 'https://civitasnews-backend.onrender.com/api';
  const TENANT_HOST = 'civitasnews.vercel.app';

  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn(
      async () => new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
    );
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    tokenStore.clear();
    vi.unstubAllGlobals();
    // installAuthFetchInterceptor est idempotent par design (un seul
    // `window.fetch` remplacé pour toute la durée de vie de l'app) --
    // ça veut aussi dire que le premier appel dans ce fichier "gèle" son
    // `originalFetch` pour tous les tests suivants. On force un module
    // frais (non installé) avant chaque test via resetModules + import
    // dynamique dans le corps de chaque test.
    vi.resetModules();
  });

  it('ajoute X-Tenant-Domain sur une requête vers notre API (via les 4 services HTTP)', async () => {
    const { installAuthFetchInterceptor: install } = await import('../authFetchInterceptor');
    install(API_BASE_URL, TENANT_HOST);

    const service = new GetService(API_BASE_URL);
    await service.get({ endpoint: '/sondages/v1/sondages/', requireAuth: false });

    const call = mockFetch.mock.calls[0];
    const headers = new Headers(call[1]?.headers as HeadersInit);
    expect(headers.get('X-Tenant-Domain')).toBe(TENANT_HOST);
  });

  it('ajoute aussi X-Tenant-Domain sur un fetch direct (pas seulement via GetService/PostService)', async () => {
    const { installAuthFetchInterceptor: install } = await import('../authFetchInterceptor');
    install(API_BASE_URL, TENANT_HOST);

    await fetch(`${API_BASE_URL}/token/v1/login/`, { method: 'POST', body: '{}' });

    const call = mockFetch.mock.calls[0];
    const headers = new Headers(call[1]?.headers as HeadersInit);
    expect(headers.get('X-Tenant-Domain')).toBe(TENANT_HOST);
  });

  it("n'ajoute PAS X-Tenant-Domain sur une requête vers une origine externe (ex: Google Identity)", async () => {
    const { installAuthFetchInterceptor: install } = await import('../authFetchInterceptor');
    install(API_BASE_URL, TENANT_HOST);

    await fetch('https://accounts.google.com/gsi/client', { method: 'GET' });

    const call = mockFetch.mock.calls[0];
    const headers = new Headers(call[1]?.headers as HeadersInit);
    expect(headers.get('X-Tenant-Domain')).toBeNull();
  });

  it('ne pose rien si tenantHost est null (rendu hors navigateur / non résolu)', async () => {
    const { installAuthFetchInterceptor: install } = await import('../authFetchInterceptor');
    install(API_BASE_URL, null);

    const service = new GetService(API_BASE_URL);
    await service.get({ endpoint: '/sondages/v1/sondages/', requireAuth: false });

    const call = mockFetch.mock.calls[0];
    const headers = new Headers(call[1]?.headers as HeadersInit);
    expect(headers.get('X-Tenant-Domain')).toBeNull();
  });

  it("ne remplace pas un X-Tenant-Domain déjà posé explicitement par l'appelant", async () => {
    const { installAuthFetchInterceptor: install } = await import('../authFetchInterceptor');
    install(API_BASE_URL, TENANT_HOST);

    await fetch(`${API_BASE_URL}/sondages/v1/sondages/`, {
      headers: { 'X-Tenant-Domain': 'autretenant.vercel.app' },
    });

    const call = mockFetch.mock.calls[0];
    const headers = new Headers(call[1]?.headers as HeadersInit);
    expect(headers.get('X-Tenant-Domain')).toBe('autretenant.vercel.app');
  });
});
