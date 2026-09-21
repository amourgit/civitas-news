// ============================================================
// Test de CONTRAT : les fixtures JSON de ce dossier sont de VRAIES
// réponses du backend (branche civitas-news, Postgres réel, middleware
// multi-tenant inclus -- enveloppe fan-out `[{tenant, statusCode, data}]`
// pour les GET). Ils vérifient que le frontend sait lire ce que le
// serveur envoie réellement, y compris ses erreurs internes (HTTP 200
// enveloppant un 404/403), et qu'aucun champ privé ne fuit dans le
// profil public. À régénérer si le contrat backend change.
// ============================================================
import { describe, expect, it } from 'vitest';
import { unwrapToPrimaryTenant } from '../../utils/tenantEnvelope';
import { ApiError } from '../../errors';
import {
  TenantInformationsPrimairesSchema,
  TenantProfilPublicSchema,
  TenantSchema,
} from '../tenants.repository';
import { ficheErrorMessage } from '../../../../features/organisations/details/useOrganisationDetails';
import profilPublic from './fixtures/profil-public.envelope.json';
import profilInconnu from './fixtures/profil-public-inconnu.envelope.json';
import informations from './fixtures/informations-primaires.envelope.json';
import informations403 from './fixtures/informations-primaires-403.envelope.json';
import identitePatch from './fixtures/identite.patch.json';

const CHAMPS_PRIVES = [
  'numeroRccm', 'numeroNif', 'numeroAgrement', 'adresseSiege', 'telephonePrincipal', 'emailContact',
  'responsableNomComplet', 'responsableEmail', 'contactOperationnelNom', 'effectifEstime',
  'commentaireVerification', 'statut',
];

describe('contrat backend — profil public', () => {
  it('se lit avec le schéma du frontend et n’expose que la liste blanche', () => {
    const profil = TenantProfilPublicSchema.parse(unwrapToPrimaryTenant(profilPublic));
    expect(profil.sousDomaine).toBe('civitasnews');
    expect(profil.fichePublique?.raisonSociale).toBe('Civitas SA');
    expect(profil.fichePublique?.identiteVerifiee).toBe(false);
    for (const champ of CHAMPS_PRIVES) expect(profil.fichePublique ?? {}).not.toHaveProperty(champ);
  });

  it('transforme le 404 interne de l’enveloppe en ApiError(404) reconnaissable', () => {
    let erreur: unknown;
    try {
      unwrapToPrimaryTenant(profilInconnu);
    } catch (e) {
      erreur = e;
    }
    expect(erreur).toBeInstanceOf(ApiError);
    expect((erreur as ApiError).status).toBe(404);
    expect((erreur as ApiError).message).toBe('Organisation introuvable.');
  });
});

describe('contrat backend — fiche administrative', () => {
  it('se lit avec le schéma du frontend', () => {
    const fiche = TenantInformationsPrimairesSchema.parse(unwrapToPrimaryTenant(informations));
    expect(fiche.statut).toBe('a_completer');
    expect(fiche.raisonSociale).toBe('Civitas SA');
  });

  it('un refus (403) sur un autre tenant remonte en ApiError(403) avec un message adapté', () => {
    let erreur: unknown;
    try {
      unwrapToPrimaryTenant(informations403);
    } catch (e) {
      erreur = e;
    }
    expect((erreur as ApiError).status).toBe(403);
    expect(ficheErrorMessage(erreur)).toMatch(/administrateur de cette organisation/);
  });
});

describe('contrat backend — identité', () => {
  it('la réponse du PATCH /identite/ est un Tenant valide', () => {
    expect(TenantSchema.parse(identitePatch).name).toBe('Civitas News');
  });
});

describe('ficheErrorMessage', () => {
  it('distingue session expirée, backend sans la route et panne générique', () => {
    expect(ficheErrorMessage({ status: 401 })).toMatch(/session a expiré/);
    expect(ficheErrorMessage({ status: 404 })).toMatch(/backend/);
    expect(ficheErrorMessage(new Error('réseau'))).toMatch(/Réessayez/);
  });
});
