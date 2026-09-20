// ============================================================
// src/services/api/__tests__/users.repository.test.ts
// Verrouille le contrat d'écriture de usersRepository.update, utilisé
// par la fiche Utilisateur du backoffice (édition en place) :
//
//  1. Un `null` explicite DOIT partir dans le body du PATCH. C'est la
//     seule façon, côté DRF, de VIDER une FK (établissement,
//     organisation) ou une date (date de naissance). Le sanitizer
//     générique retire pourtant les null (utile pour des query params) :
//     sans `preserveNull`, « — Aucun(e) — » était silencieusement
//     ignoré alors que l'interface confirmait l'enregistrement.
//
//  2. La réponse d'un PATCH est produite par UserUpdateSerializer
//     (users/api/v1/serializers.py), qui n'expose NI `id` NI `username`
//     NI `badges`. Valider cette réponse avec BackendUserSchema faisait
//     échouer TOUTE sauvegarde (« Response validation failed ») alors
//     que le backend avait bien enregistré. La méthode relit donc la
//     fiche complète (GET) après le PATCH.
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usersRepository } from '../repositories/users.repository';
import { tokenStore } from '../token/tokenStore';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Ce que renvoie réellement PATCH /users/v1/users/:id/ (UserUpdateSerializer, clés en camelCase). */
const PATCH_RESPONSE_PARTIELLE = {
  email: 'amina@example.com',
  firstName: 'Amina',
  lastName: 'Bongo',
  isActive: true,
  isVerified: true,
  role: 'moderateur',
  etablissement: null,
  organisation: null,
  phoneNumber: null,
  address: '',
  dateOfBirth: null,
};

/** Ce que renvoie GET /users/v1/users/:id/ (UserSerializer, forme complète). */
const FICHE_COMPLETE = { id: 5, username: 'amina.b', ...PATCH_RESPONSE_PARTIELLE, badges: [] };

describe('usersRepository.update', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    tokenStore.setTokens({ access: 'FAKE.ACCESS.TOKEN' });
    fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      init?.method === 'PATCH' ? json(PATCH_RESPONSE_PARTIELLE) : json(FICHE_COMPLETE),
    );
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    tokenStore.clear();
    vi.unstubAllGlobals();
  });

  const patchCall = () => fetchMock.mock.calls.find(([, init]) => (init as RequestInit)?.method === 'PATCH');

  it('envoie les null explicites (vider un établissement ou une date de naissance)', async () => {
    await usersRepository.update(5, { etablissement: null, dateOfBirth: null, firstName: 'Amina' });

    const call = patchCall();
    expect(call).toBeDefined();
    const body = JSON.parse(String((call![1] as RequestInit).body));
    expect(body).toMatchObject({ etablissement: null, dateOfBirth: null, firstName: 'Amina' });
  });

  it('envoie une chaîne vide pour effacer un texte (téléphone, adresse)', async () => {
    await usersRepository.update(5, { phoneNumber: '', address: '' });

    const body = JSON.parse(String((patchCall()![1] as RequestInit).body));
    expect(body).toMatchObject({ phoneNumber: '', address: '' });
  });

  it('résout avec la fiche COMPLÈTE même si la réponse du PATCH est partielle', async () => {
    const saved = await usersRepository.update(5, { firstName: 'Amina' });

    expect(saved.id).toBe(5);
    expect(saved.username).toBe('amina.b');
    // 1 PATCH + 1 GET de relecture.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
