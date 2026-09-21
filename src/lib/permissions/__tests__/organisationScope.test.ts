import { describe, expect, it } from 'vitest';
import { canOnOrganisation, resolveOrganisationScope } from '../organisationScope';
import { PERMISSIONS } from '../permissions.catalog';
import type { Utilisateur } from '../../../types/models/user.types';

const userWithRole = (role: Utilisateur['role']): Utilisateur => ({
  id: '1', username: 'u', nomAffiche: 'U', role, badges: [], stats: { contributions: 0, votes: 0, commentaires: 0 },
});

describe('resolveOrganisationScope', () => {
  const current = { domainHeaderValue: 'acme', name: 'Acme' };
  it('reconnaît l’organisation courante par sous-domaine ou domaine', () => {
    expect(resolveOrganisationScope({ sousDomaine: 'ACME' }, current)).toBe('courante');
    expect(resolveOrganisationScope({ sousDomaine: 'x', domain: 'acme' }, current)).toBe('courante');
  });
  it('considère toute autre organisation comme consultée', () => {
    expect(resolveOrganisationScope({ sousDomaine: 'autre' }, current)).toBe('consultee');
    expect(resolveOrganisationScope({ sousDomaine: 'acme' }, null)).toBe('consultee');
  });
});

describe('canOnOrganisation', () => {
  const admin = userWithRole('administrateur');
  it('accorde la fiche et son édition à l’administrateur sur l’organisation courante', () => {
    expect(canOnOrganisation(admin, PERMISSIONS.ORGANISATION_FICHE_VIEW, 'courante')).toBe(true);
    expect(canOnOrganisation(admin, PERMISSIONS.ORGANISATION_FICHE_EDIT_IDENTITE, 'courante')).toBe(true);
  });
  it('refuse tout privilège d’administrateur sur une organisation simplement consultée', () => {
    expect(canOnOrganisation(admin, PERMISSIONS.ORGANISATION_FICHE_VIEW, 'consultee')).toBe(false);
    expect(canOnOrganisation(admin, PERMISSIONS.ORGANISATION_FICHE_EDIT_COORDONNEES, 'consultee')).toBe(false);
    expect(canOnOrganisation(admin, PERMISSIONS.ORGANISATION_VERIFICATION_VIEW, 'consultee')).toBe(false);
  });
  it('garde l’identité publique visible partout', () => {
    expect(canOnOrganisation(userWithRole('anonyme'), PERMISSIONS.ORGANISATION_VIEW_PUBLIC, 'consultee')).toBe(true);
  });
  it('refuse la fiche aux rôles non administrateurs, même sur l’organisation courante', () => {
    for (const role of ['anonyme', 'etudiant', 'organisation', 'moderateur'] as const) {
      expect(canOnOrganisation(userWithRole(role), PERMISSIONS.ORGANISATION_FICHE_VIEW, 'courante')).toBe(false);
    }
  });
});
