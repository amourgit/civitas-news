// ============================================================
// src/services/api/utils/__tests__/tenantEnvelope.test.ts
// Fonctions pures -- pas de mock de module nécessaire, contrairement à
// tenants.store.test.ts ou authFetchInterceptor.test.ts.
// ============================================================

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  isTenantEnvelope,
  unwrapToPrimaryTenant,
  flattenPaginatedEnvelope,
  type TenantEnvelopeEntry,
} from '../tenantEnvelope';

const TENANT_COURANT = { id: 1, name: 'Campus Test', sousDomaine: 'campus-test', isPublic: false };
const TENANT_PUBLIC = { id: 2, name: 'Ministère de la Santé', sousDomaine: 'ministere-sante', isPublic: true };

describe('isTenantEnvelope', () => {
  it('lève une ApiError quand le tenant PRINCIPAL est en erreur, mais ignore l’échec d’un tenant secondaire', () => {
    const tenant = { id: 1, name: 'A', sousDomaine: 'a', isPublic: false };
    const enErreur = [{ tenant, statusCode: 404, data: { detail: 'Introuvable.' } }];
    expect(() => unwrapToPrimaryTenant(enErreur)).toThrow('Introuvable.');
    const secondaireEnErreur = [
      { tenant, statusCode: 200, data: { ok: true } },
      { tenant: { ...tenant, id: 2 }, statusCode: 403, data: { detail: 'Refusé.' } },
    ];
    expect(unwrapToPrimaryTenant(secondaireEnErreur)).toEqual({ ok: true });
  });

  it("reconnaît la forme [{tenant, statusCode, data}, ...] renvoyée par le fan-out GET backend", () => {
    const envelope = [
      { tenant: TENANT_COURANT, statusCode: 200, data: { results: [] } },
      { tenant: TENANT_PUBLIC, statusCode: 200, data: { results: [] } },
    ];
    expect(isTenantEnvelope(envelope)).toBe(true);
  });

  it("ne confond pas un tableau nu de ressources (ex: annuaire de tenants) avec l'enveloppe", () => {
    expect(isTenantEnvelope([{ id: 1, name: 'Campus Test', sousDomaine: 'campus-test' }])).toBe(false);
  });

  it("ne confond pas un objet paginé DRF ({count, results}) avec l'enveloppe", () => {
    expect(isTenantEnvelope({ count: 2, next: null, previous: null, results: [] })).toBe(false);
  });

  it('tableau vide -> pas une enveloppe (rien à y reconnaître)', () => {
    expect(isTenantEnvelope([])).toBe(false);
  });
});

describe('unwrapToPrimaryTenant', () => {
  it("replie sur data du PREMIER élément (tenant courant, toujours en tête -- voir tenants.store.ts)", () => {
    const envelope = [
      { tenant: TENANT_COURANT, statusCode: 200, data: { results: ['a'] } },
      { tenant: TENANT_PUBLIC, statusCode: 200, data: { results: ['b'] } },
    ];
    expect(unwrapToPrimaryTenant(envelope)).toEqual({ results: ['a'] });
  });

  it("laisse passer une réponse qui n'est pas l'enveloppe -- comportement historique préservé", () => {
    const reponseBrute = { count: 1, results: [{ id: 1 }] };
    expect(unwrapToPrimaryTenant(reponseBrute)).toBe(reponseBrute);
  });

  it("tableau vide -> pas reconnu comme enveloppe, traverse inchangé (le backend en produit toujours au moins 1 élément)", () => {
    expect(unwrapToPrimaryTenant([])).toEqual([]);
  });
});

describe('flattenPaginatedEnvelope', () => {
  const ItemSchema = z.object({ id: z.number(), titre: z.string() });

  it('aplatit chaque tenant en {item, tenant}[], en préservant l\'ordre des tenants', () => {
    const envelope: TenantEnvelopeEntry[] = [
      { tenant: TENANT_COURANT, statusCode: 200, data: { results: [{ id: 1, titre: 'A' }] } },
      { tenant: TENANT_PUBLIC, statusCode: 200, data: { results: [{ id: 2, titre: 'B' }] } },
    ];

    const flat = flattenPaginatedEnvelope(envelope, ItemSchema);

    expect(flat).toEqual([
      { item: { id: 1, titre: 'A' }, tenant: TENANT_COURANT },
      { item: { id: 2, titre: 'B' }, tenant: TENANT_PUBLIC },
    ]);
  });

  it('ignore un tenant en erreur (statusCode >= 400) sans faire échouer les autres', () => {
    const envelope: TenantEnvelopeEntry[] = [
      { tenant: TENANT_COURANT, statusCode: 200, data: { results: [{ id: 1, titre: 'A' }] } },
      { tenant: TENANT_PUBLIC, statusCode: 403, data: { detail: 'Non autorisé' } },
    ];

    const flat = flattenPaginatedEnvelope(envelope, ItemSchema);

    expect(flat).toEqual([{ item: { id: 1, titre: 'A' }, tenant: TENANT_COURANT }]);
  });

  it('ignore un item individuel invalide sans faire échouer les autres du même tenant', () => {
    const envelope: TenantEnvelopeEntry[] = [
      {
        tenant: TENANT_COURANT,
        statusCode: 200,
        data: { results: [{ id: 1, titre: 'A' }, { id: 'pas-un-nombre', titre: 'B' }] },
      },
    ];

    const flat = flattenPaginatedEnvelope(envelope, ItemSchema);

    expect(flat).toEqual([{ item: { id: 1, titre: 'A' }, tenant: TENANT_COURANT }]);
  });

  it('data absent (null) -> zéro élément pour ce tenant', () => {
    const envelope: TenantEnvelopeEntry[] = [{ tenant: TENANT_COURANT, statusCode: 200, data: null }];
    expect(flattenPaginatedEnvelope(envelope, ItemSchema)).toEqual([]);
  });

  it('accepte aussi data directement en tableau (pas seulement paginé {results})', () => {
    const envelope: TenantEnvelopeEntry[] = [
      { tenant: TENANT_COURANT, statusCode: 200, data: [{ id: 1, titre: 'A' }] },
    ];
    expect(flattenPaginatedEnvelope(envelope, ItemSchema)).toEqual([
      { item: { id: 1, titre: 'A' }, tenant: TENANT_COURANT },
    ]);
  });
});
