// ============================================================
// src/lib/permissions/organisationScope.ts
// Portée d'une permission « organisation » : COURANTE ou CONSULTÉE.
//
// Chaque organisation (tenant) a ses propres comptes et sa propre
// session (voir store/tenants.store.ts). Le rôle de l'utilisateur
// (`user.role`) n'a donc de sens QUE dans l'organisation courante :
// un administrateur de A qui consulte B n'est, pour B, qu'un visiteur.
// Toute permission de ORGANISATION_SCOPED_PERMISSIONS est par
// conséquent refusée dès que la portée n'est pas « courante », même
// si le rôle la porte. Le backend applique la même règle
// (IsAccessTokenTenant) — ceci évite d'afficher des boutons voués à
// un 403 ; la sécurité réelle reste côté serveur.
// ============================================================

import type { Utilisateur } from '../../types/models/user.types';
import type { TenantRef } from '../../store/tenants.store';
import { hasPermission } from './hasPermission';
import { PERMISSIONS, type Permission } from './permissions.catalog';

export type OrganisationScope = 'courante' | 'consultee';

/** Permissions qui n'existent que sur l'organisation courante. */
export const ORGANISATION_SCOPED_PERMISSIONS: ReadonlySet<Permission> = new Set<Permission>([
  PERMISSIONS.ORGANISATION_FICHE_VIEW,
  PERMISSIONS.ORGANISATION_FICHE_EDIT_IDENTITE,
  PERMISSIONS.ORGANISATION_FICHE_EDIT_COORDONNEES,
  PERMISSIONS.ORGANISATION_FICHE_EDIT_RESPONSABLES,
  PERMISSIONS.ORGANISATION_FICHE_EDIT_ACTIVITES,
  PERMISSIONS.ORGANISATION_VERIFICATION_VIEW,
]);

interface TenantIdentity {
  sousDomaine: string;
  domain?: string | null;
}

/** Une organisation est « courante » si elle correspond au tenant de la session (domainHeaderValue = sousDomaine, voir TenantSelectButton). */
export function resolveOrganisationScope(tenant: TenantIdentity, currentTenant: TenantRef | null): OrganisationScope {
  if (!currentTenant) return 'consultee';
  const current = currentTenant.domainHeaderValue.toLowerCase();
  const isSame = [tenant.sousDomaine, tenant.domain].some((value) => !!value && value.toLowerCase() === current);
  return isSame ? 'courante' : 'consultee';
}

export function canOnOrganisation(
  user: Utilisateur | null | undefined,
  permission: Permission,
  scope: OrganisationScope,
): boolean {
  if (!hasPermission(user, permission)) return false;
  return ORGANISATION_SCOPED_PERMISSIONS.has(permission) ? scope === 'courante' : true;
}
