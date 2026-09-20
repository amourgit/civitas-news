// ============================================================
// src/services/api/utils/__tests__/sanitizer.test.ts
// Le sanitizer retire par défaut les null/undefined (pratique pour des
// query params : pas de "?foo=null"). `preserveNull` existe pour les
// bodies PATCH, où null = « vider ce champ » côté DRF.
// ============================================================

import { describe, it, expect } from 'vitest';
import { RequestSanitizer } from '../sanitizer';

describe('RequestSanitizer.sanitizeParams', () => {
  it('retire undefined et null par défaut', () => {
    expect(RequestSanitizer.sanitizeParams({ a: 1, b: null, c: undefined, d: '' })).toEqual({ a: 1, d: '' });
  });

  it('conserve les null explicites avec preserveNull, mais retire toujours undefined', () => {
    const out = RequestSanitizer.sanitizeParams(
      { etablissement: null, dateOfBirth: null, address: '', ignore: undefined },
      { preserveNull: true },
    );
    expect(out).toEqual({ etablissement: null, dateOfBirth: null, address: '' });
    expect('ignore' in out).toBe(false);
  });

  it('propage preserveNull aux objets imbriqués', () => {
    const out = RequestSanitizer.sanitizeParams({ a: { b: null, c: undefined } }, { preserveNull: true });
    expect(out).toEqual({ a: { b: null } });
  });

  it('continue de neutraliser les clés dangereuses et les balises <script> avec preserveNull', () => {
    const out = RequestSanitizer.sanitizeParams(
      { address: 'Rue 1<script>alert(1)</script>', nul: null },
      { preserveNull: true },
    );
    expect(out.address).toBe('Rue 1');
    expect(out.nul).toBeNull();
  });
});
