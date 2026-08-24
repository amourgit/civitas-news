import { describe, it, expect } from 'vitest';
import { extractFkId, toDatetimeLocalValue, toDateValue } from '../utils';

describe('extractFkId', () => {
  it('renvoie undefined pour null/undefined/chaîne vide', () => {
    expect(extractFkId(null)).toBeUndefined();
    expect(extractFkId(undefined)).toBeUndefined();
    expect(extractFkId('')).toBeUndefined();
  });

  it('extrait l’id d’un objet imbriqué (ex: News.categorie)', () => {
    expect(extractFkId({ id: '42', nom: 'Économie' })).toBe('42');
  });

  it('stringifie une valeur primitive (ex: BackendUser.etablissement)', () => {
    expect(extractFkId(7)).toBe('7');
    expect(extractFkId('42')).toBe('42');
  });
});

describe('toDatetimeLocalValue', () => {
  it('tronque une chaîne ISO au format datetime-local', () => {
    expect(toDatetimeLocalValue('2026-08-23T14:30:00+01:00')).toBe('2026-08-23T14:30');
  });

  it('renvoie une chaîne vide pour une valeur non-string', () => {
    expect(toDatetimeLocalValue(undefined)).toBe('');
    expect(toDatetimeLocalValue(null)).toBe('');
  });
});

describe('toDateValue', () => {
  it('tronque une chaîne ISO au format date', () => {
    expect(toDateValue('2026-08-23T14:30:00Z')).toBe('2026-08-23');
  });
});
