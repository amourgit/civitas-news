// ============================================================
// Logique pure de la fiche Utilisateur (userProfile.logic.ts) :
// brouillon, diff, validation, normalisation, patch PATCH, erreurs DRF.
// ============================================================

import { describe, it, expect } from 'vitest';
import type { BackendUser } from '../../../../../types/models/backend.types';
import {
  buildDraft, buildUserPatch, computeChanges, formatDateOnly, interpretSaveError,
  normalizePhone, validateDraft, IDENTIFIER_REQUIRED_MESSAGE,
} from '../userProfile.logic';

const record: BackendUser = {
  id: 42,
  username: 'amina.b',
  firstName: 'Amina',
  lastName: 'Bongo',
  email: 'amina@example.com',
  phoneNumber: '+24106123456',
  address: 'Libreville',
  dateOfBirth: '1998-03-04',
  role: 'moderateur',
  isActive: true,
  isVerified: false,
  etablissement: 10,
  organisation: null,
};

describe('buildDraft', () => {
  it('convertit les FK en chaînes, garde le vide comme chaîne vide', () => {
    const d = buildDraft(record);
    expect(d.etablissement).toBe('10');
    expect(d.organisation).toBe('');
    expect(d.dateOfBirth).toBe('1998-03-04');
  });

  it('traite isActive absent comme actif, mais false explicite comme inactif', () => {
    expect(buildDraft({ ...record, isActive: undefined }).isActive).toBe(true);
    expect(buildDraft({ ...record, isActive: false }).isActive).toBe(false);
  });

  it('remplace null/undefined par des chaînes vides', () => {
    const d = buildDraft({ id: 1, username: 'x', email: null, phoneNumber: null, dateOfBirth: null });
    expect(d).toMatchObject({ email: '', phoneNumber: '', dateOfBirth: '', firstName: '', address: '', role: '' });
  });
});

describe('normalizePhone', () => {
  it('ne garde que les chiffres et un « + » initial (miroir du backend)', () => {
    expect(normalizePhone(' +241 06-12.34 56 ')).toBe('+24106123456');
    expect(normalizePhone('06 12 34 56 78')).toBe('0612345678');
    expect(normalizePhone('abc')).toBe('');
  });
});

describe('computeChanges', () => {
  const base = buildDraft(record);

  it("n'est pas modifié par une retouche d'espaces, de casse d'email ou de format de téléphone", () => {
    const draft = { ...base, firstName: ' Amina ', email: 'AMINA@Example.com ', phoneNumber: '+241 06 12 34 56' };
    expect(computeChanges(base, draft)).toEqual({});
  });

  it('ne renvoie que les champs modifiés, normalisés', () => {
    const draft = { ...base, email: ' Nouveau@Example.COM ', isVerified: true, etablissement: '' };
    expect(computeChanges(base, draft)).toEqual({ email: 'nouveau@example.com', isVerified: true, etablissement: '' });
  });
});

describe('validateDraft', () => {
  const base = buildDraft(record);

  it('accepte un brouillon inchangé', () => {
    expect(validateDraft(base, base)).toEqual({});
  });

  it('refuse un email et un téléphone mal formés', () => {
    const errors = validateDraft(base, { ...base, email: 'pas-un-email', phoneNumber: '123' });
    expect(errors.email).toMatch(/email valide/i);
    expect(errors.phoneNumber).toMatch(/numéro valide/i);
  });

  it("refuse de vider les DEUX identifiants de connexion (email + téléphone)", () => {
    const errors = validateDraft(base, { ...base, email: '', phoneNumber: '' });
    expect(errors.email).toBe(IDENTIFIER_REQUIRED_MESSAGE);
    expect(errors.phoneNumber).toBe(IDENTIFIER_REQUIRED_MESSAGE);
  });

  it("autorise de vider l'email tant que le téléphone reste renseigné", () => {
    expect(validateDraft(base, { ...base, email: '' })).toEqual({});
  });

  it("n'impose pas la règle des identifiants à un compte historique qui n'en a aucun, si on n'y touche pas", () => {
    const legacy = buildDraft({ id: 2, username: 'ancien' });
    expect(validateDraft(legacy, { ...legacy, firstName: 'Nouveau' })).toEqual({});
  });

  it("ignore une valeur historique invalide non modifiée", () => {
    const legacy = { ...base, phoneNumber: '12' };
    expect(validateDraft(legacy, { ...legacy, address: 'Ailleurs' })).toEqual({});
  });

  it('refuse une date de naissance dans le futur', () => {
    const errors = validateDraft(base, { ...base, dateOfBirth: '2999-01-01' }, new Date('2026-09-21'));
    expect(errors.dateOfBirth).toMatch(/futur/i);
  });

  it('refuse un nom de plus de 150 caractères', () => {
    expect(validateDraft(base, { ...base, lastName: 'x'.repeat(151) }).lastName).toMatch(/150/);
  });
});

describe('buildUserPatch', () => {
  it("n'envoie pas une clé absente -- et n'écrase donc JAMAIS la date de naissance par null", () => {
    const patch = buildUserPatch({ firstName: 'Nouveau' });
    expect(patch).toEqual({ firstName: 'Nouveau' });
    expect('dateOfBirth' in patch).toBe(false);
  });

  it('une chaîne vide efface un texte (téléphone, adresse, email)', () => {
    expect(buildUserPatch({ phoneNumber: '', address: '', email: '' })).toEqual({ phoneNumber: '', address: '', email: '' });
  });

  it('une valeur vide sur une FK ou une date devient null (= vider)', () => {
    expect(buildUserPatch({ etablissement: '', organisation: '', dateOfBirth: '' })).toEqual({
      etablissement: null, organisation: null, dateOfBirth: null,
    });
  });

  it('convertit les ids de FK en nombres, conserve les booléens et le rôle', () => {
    expect(buildUserPatch({ etablissement: '10', isActive: false, isVerified: true, role: 'etudiant' })).toEqual({
      etablissement: 10, isActive: false, isVerified: true, role: 'etudiant',
    });
  });

  it("n'envoie pas un rôle vide", () => {
    expect('role' in buildUserPatch({ role: '' })).toBe(false);
  });
});

describe('interpretSaveError', () => {
  it('rattache les erreurs DRF (400) à leur champ', () => {
    const err = Object.assign(new Error('Bad Request'), {
      details: { email: ['Cette adresse est déjà utilisée.'], phoneNumber: 'Numéro déjà utilisé.', ignore: ['x'] },
    });
    const report = interpretSaveError(err);
    expect(report.fieldErrors).toEqual({
      email: 'Cette adresse est déjà utilisée.',
      phoneNumber: 'Numéro déjà utilisé.',
    });
    expect(report.message).toMatch(/champs sont invalides/i);
  });

  it("retombe sur le message de l'erreur sinon", () => {
    expect(interpretSaveError(new Error('Erreur réseau')).message).toBe('Erreur réseau');
    expect(interpretSaveError('n’importe quoi').message).toBe('Une erreur est survenue.');
  });
});

describe('formatDateOnly', () => {
  it("n'introduit aucun décalage de fuseau sur une date pure", () => {
    expect(formatDateOnly('1998-03-04')).toBe('4 mars 1998');
  });
});
