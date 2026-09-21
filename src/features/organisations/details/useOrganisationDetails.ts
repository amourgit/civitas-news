// ============================================================
// src/features/organisations/details/useOrganisationDetails.ts
// Charge ce que l'utilisateur a le DROIT de voir pour une organisation :
//  - toujours l'identité publique (annuaire) ;
//  - la fiche administrative (informations-primaires) UNIQUEMENT si
//    l'organisation est la COURANTE et que le rôle le permet — sinon
//    l'appel n'est même pas émis (le backend le refuserait de toute
//    façon, voir lib/permissions/organisationScope.ts).
// `sousDomaine` absent = organisation courante.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  tenantsRepository,
  type TenantFichePublique,
  type TenantIdentiteUpdatePayload,
  type TenantInformationsPrimaires,
  type TenantInformationsPrimairesEcriturePayload,
  type TenantProfilPublic,
} from '../../../services/api/repositories/tenants.repository';
import { switchTenant, useTenantsStore } from '../../../store/tenants.store';
import { useAuthStore } from '../../../store/auth.store';
import { PERMISSIONS, type Permission } from '../../../lib/permissions/permissions.catalog';
import {
  canOnOrganisation,
  resolveOrganisationScope,
  type OrganisationScope,
} from '../../../lib/permissions/organisationScope';

export type OrganisationLoadState = 'loading' | 'ready' | 'not-found' | 'error';

export function useOrganisationDetails(sousDomaine?: string) {
  const { currentTenant } = useTenantsStore();
  const { user, isHydrating } = useAuthStore();

  const target = (sousDomaine ?? currentTenant?.domainHeaderValue ?? '').toLowerCase();

  const [tenant, setTenant] = useState<TenantProfilPublic | null>(null);
  const [state, setState] = useState<OrganisationLoadState>('loading');
  const [fiche, setFiche] = useState<TenantInformationsPrimaires | null>(null);
  const [ficheError, setFicheError] = useState<string | null>(null);

  // Identité de l'organisation ciblée, même sans tenant chargé (repli sur la cible).
  const scope: OrganisationScope = resolveOrganisationScope(
    tenant ?? { sousDomaine: target },
    currentTenant,
  );
  const can = useCallback((permission: Permission) => canOnOrganisation(user, permission, scope), [user, scope]);
  const canViewFiche = can(PERMISSIONS.ORGANISATION_FICHE_VIEW);

  // 1. Identité publique.
  useEffect(() => {
    if (!target) {
      setState('not-found');
      return;
    }
    let cancelled = false;
    setState('loading');
    setFiche(null);
    setFicheError(null);
    // Profil public (identité + extrait public de la fiche) ; un domaine
    // complet (VITE_TENANT_HOST) n'est pas un sous-domaine valide -> repli
    // sur l'annuaire, qui sait aussi retrouver un tenant par son domaine.
    const loadProfil = async (): Promise<TenantProfilPublic | null> => {
      const profil = /^[a-z0-9-]+$/.test(target) ? await tenantsRepository.getProfilPublic(target) : null;
      return profil ?? (await tenantsRepository.getBySousDomaine(target));
    };
    loadProfil()
      .then((found) => {
        if (cancelled) return;
        if (found) {
          setTenant(found);
          setState('ready');
        } else if (!sousDomaine && currentTenant) {
          // Organisation courante absente de l'annuaire (ex : non publique) :
          // on affiche au moins ce que le store en sait.
          setTenant({ id: 0, name: currentTenant.name, sousDomaine: currentTenant.domainHeaderValue });
          setState('ready');
        } else {
          setTenant(null);
          setState('not-found');
        }
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
    // currentTenant volontairement hors dépendances : seule la cible compte pour recharger l'identité.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, sousDomaine]);

  // 2. Fiche administrative — seulement si autorisé (portée courante + rôle).
  useEffect(() => {
    if (state !== 'ready' || isHydrating || !canViewFiche) {
      setFiche(null);
      return;
    }
    let cancelled = false;
    setFicheError(null);
    tenantsRepository
      .getInformationsPrimaires()
      .then((data) => {
        if (!cancelled) setFiche(data);
      })
      .catch(() => {
        if (!cancelled) setFicheError('Impossible de charger la fiche de l’organisation pour le moment.');
      });
    return () => {
      cancelled = true;
    };
  }, [state, isHydrating, canViewFiche]);

  const saveFiche = useCallback(
    async (patch: TenantInformationsPrimairesEcriturePayload) => {
      const updated = await tenantsRepository.updateInformationsPrimaires(patch);
      setFiche(updated);
      return updated;
    },
    [],
  );

  /** Nom / description / logo -- la permission est revérifiée ICI, pas seulement au rendu du bouton. */
  const saveIdentite = useCallback(
    async (payload: TenantIdentiteUpdatePayload) => {
      if (!can(PERMISSIONS.ORGANISATION_IDENTITE_EDIT)) throw new Error('Modification non autorisée.');
      const updated = await tenantsRepository.updateIdentite(payload);
      setTenant((previous) => ({ ...(previous ?? updated), ...updated }));
      // Garde le libellé du sélecteur d'organisations à jour.
      if (currentTenant) switchTenant({ domainHeaderValue: currentTenant.domainHeaderValue, name: updated.name });
      return updated;
    },
    [can, currentTenant],
  );

  const fichePublique: TenantFichePublique | null = tenant?.fichePublique ?? null;

  return useMemo(
    () => ({
      tenant, state, scope, isCurrent: scope === 'courante', can, canViewFiche, fiche, ficheError, fichePublique,
      saveFiche, saveIdentite, isHydrating,
    }),
    [tenant, state, scope, can, canViewFiche, fiche, ficheError, fichePublique, saveFiche, saveIdentite, isHydrating],
  );
}
