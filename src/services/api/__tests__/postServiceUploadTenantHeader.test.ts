// ============================================================
// src/services/api/__tests__/postServiceUploadTenantHeader.test.ts
//
// Régression ciblée : uploadFiles() avec `onProgress` bascule sur
// XMLHttpRequest (voir PostService.ts::executeUploadRequest) car
// `fetch` ne permet pas de suivre la progression d'un envoi. Ce
// chemin n'appelle donc JAMAIS `fetch` -- il échappe entièrement à
// l'intercepteur global (token/authFetchInterceptor.ts) qui pose
// normalement X-Tenant-Domain sur toute requête vers notre API.
//
// Avant correctif : un upload avec progression partait sans le
// tenant courant, en violation du contrat "toute requête tenantisée
// porte le tenant courant, sans exception" (voir store/tenants.store.ts
// et token/__tests__/authFetchInterceptor.test.ts, qui vérifie la même
// garantie côté fetch). Ce test verrouille l'équivalent côté XHR.
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PostService } from '../PostService';

vi.mock('../../../store/tenants.store', () => ({
  // Isolé du store réel (même convention que
  // token/__tests__/authFetchInterceptor.test.ts) -- seul le contrat
  // "la valeur du tenant courant atteint bien l'en-tête" est testé ici.
  getTenantHeaderValue: () => 'civitas',
}));

class MockXMLHttpRequest {
  static instances: MockXMLHttpRequest[] = [];

  upload = { addEventListener: vi.fn() };
  status = 201;
  statusText = 'Created';
  response = JSON.stringify({ id: 'doc-1' });
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  open = vi.fn();
  setRequestHeader = vi.fn();
  send = vi.fn(() => {
    // Succès réseau immédiat et synchrone -- suffisant pour observer
    // les en-têtes posés avant l'envoi, qui est tout ce qui nous
    // intéresse ici.
    this.onload?.();
  });

  constructor() {
    MockXMLHttpRequest.instances.push(this);
  }
}

const API_BASE_URL = 'https://civitasnews-backend.onrender.com/api';

describe('PostService.uploadFiles avec onProgress (chemin XMLHttpRequest) — en-tête X-Tenant-Domain', () => {
  beforeEach(() => {
    MockXMLHttpRequest.instances = [];
    vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("pose X-Tenant-Domain sur l'upload, alors que ce chemin n'appelle jamais fetch", async () => {
    const postService = new PostService(API_BASE_URL);
    const file = new File(['contenu'], 'rapport.pdf', { type: 'application/pdf' });

    await postService.uploadFiles({
      endpoint: '/news/v1/documents/',
      files: [file],
      onProgress: () => {},
    });

    expect(MockXMLHttpRequest.instances).toHaveLength(1);
    const xhr = MockXMLHttpRequest.instances[0];
    const tenantHeaderCall = xhr.setRequestHeader.mock.calls.find(([key]) => key === 'X-Tenant-Domain');
    expect(tenantHeaderCall).toEqual(['X-Tenant-Domain', 'civitas']);
  });

  it("ne pose aucun en-tête tenant quand il n'y a pas de tenant courant (comportement identique à withTenantHeader côté fetch)", async () => {
    vi.doMock('../../../store/tenants.store', () => ({
      getTenantHeaderValue: () => null,
    }));
    vi.resetModules();
    const { PostService: FreshPostService } = await import('../PostService');

    const postService = new FreshPostService(API_BASE_URL);
    const file = new File(['contenu'], 'rapport.pdf', { type: 'application/pdf' });

    await postService.uploadFiles({
      endpoint: '/news/v1/documents/',
      files: [file],
      onProgress: () => {},
    });

    const xhr = MockXMLHttpRequest.instances[0];
    const tenantHeaderCall = xhr.setRequestHeader.mock.calls.find(([key]) => key === 'X-Tenant-Domain');
    expect(tenantHeaderCall).toBeUndefined();
  });
});
