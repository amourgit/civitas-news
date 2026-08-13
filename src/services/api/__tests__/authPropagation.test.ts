import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GetService } from '../GetService';
import { PostService } from '../PostService';
import { tokenStore } from '../token/tokenStore';

/**
 * Régression : sur les routes TENANT_PUBLIC du backend (news, commentaires,
 * sondages... — voir Backend-Core-Base/config/config.py), la lecture est
 * publique mais le backend authentifie quand même le Bearer token s'il est
 * présent (JWTAuthentication est dans DEFAULT_AUTHENTICATION_CLASSES,
 * indépendamment du classement de route) pour personnaliser la réponse
 * (userReaction, userVoteStatus, userReactions...).
 *
 * Avant correctif, les 4 services HTTP (Get/Post/Update/Delete)
 * n'attachaient `Authorization` QUE si `requireAuth: true` était passé
 * explicitement — ce qui n'est jamais le cas pour ces lectures publiques.
 * Un utilisateur connecté était donc systématiquement traité comme
 * anonyme sur toute lecture publique, faute de header envoyé.
 */
describe('Propagation opportuniste du token (Get/Post) — requireAuth=false n\'exclut plus le token', () => {
  const FAKE_ACCESS_TOKEN = 'FAKE.ACCESS.TOKEN';

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    );
  });

  afterEach(() => {
    tokenStore.clear();
    vi.unstubAllGlobals();
  });

  it('GET requireAuth=false : ajoute Authorization si un token est présent', async () => {
    tokenStore.setTokens({ access: FAKE_ACCESS_TOKEN });
    const service = new GetService('https://api.test');

    await service.get({ endpoint: '/commentaires/v1/commentaires/', requireAuth: false });

    const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = new Headers(call[1]?.headers as HeadersInit);
    expect(headers.get('Authorization')).toBe(`Bearer ${FAKE_ACCESS_TOKEN}`);
  });

  it("GET requireAuth=false : n'ajoute rien si l'utilisateur n'est pas connecté", async () => {
    const service = new GetService('https://api.test');

    await service.get({ endpoint: '/commentaires/v1/commentaires/', requireAuth: false });

    const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = new Headers(call[1]?.headers as HeadersInit);
    expect(headers.get('Authorization')).toBeNull();
  });

  it('POST requireAuth=false : ajoute Authorization si un token est présent', async () => {
    tokenStore.setTokens({ access: FAKE_ACCESS_TOKEN });
    const service = new PostService('https://api.test');

    await service.post({ endpoint: '/liens/v1/liens/1/acceder/', body: {}, requireAuth: false });

    const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const headers = new Headers(call[1]?.headers as HeadersInit);
    expect(headers.get('Authorization')).toBe(`Bearer ${FAKE_ACCESS_TOKEN}`);
  });
});
