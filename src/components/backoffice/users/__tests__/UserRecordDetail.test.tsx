// ============================================================
// src/components/backoffice/users/__tests__/UserRecordDetail.test.tsx
// Verrouille la fiche Utilisateur (UserRecordDetail.tsx, branchée via
// ModelDef.RecordExtras + recordViewMode: 'replace') :
//
//  - LECTURE : nom, rôle, statuts, cadres d'information, badges ;
//    libellés établissement/organisation résolus par id ;
//  - ÉDITION EN PLACE : « Modifier » transforme les MÊMES cadres en
//    champs (plus de formulaire séparé) ;
//  - MOT DE PASSE : cadre toujours grisé, étoiles, jamais un champ ;
//  - PERMISSIONS PAR CHAMP : un champ non permis reste affiché mais
//    verrouillé ; garde anti-auto-verrouillage sur son propre compte ;
//  - ENREGISTREMENT : seuls les champs modifiés partent, les erreurs du
//    backend sont rattachées à leur cadre, abandon confirmé.
// ============================================================

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserRecordDetail from '../UserRecordDetail';
import type { ModelDef } from '../../registry/types';
import type { BackendUser } from '../../../../types/models/backend.types';
import { PERMISSIONS } from '../../../../lib/permissions/permissions.catalog';
import { ApiError } from '../../../../services/api/errors/ApiError';

const mocks = vi.hoisted(() => ({
  allowed: new Set<string>(),
  currentUserId: '1',
}));

vi.mock('../../../../lib/permissions/usePermissions', () => ({
  usePermissions: () => ({ can: (permission: string) => mocks.allowed.has(permission) }),
}));

vi.mock('../../../../store/auth.store', () => ({
  useAuthStore: () => ({ user: { id: mocks.currentUserId, role: 'administrateur' } }),
}));

vi.mock('../../../../services/api/repositories/referentiels.repository', () => ({
  referentielsRepository: {
    getEtablissement: vi.fn(() => Promise.resolve({ id: '10', nom: 'Université de Libreville' })),
    getOrganisation: vi.fn(() => Promise.resolve({ id: '20', nom: 'ONG Test' })),
    listEtablissements: vi.fn(() => Promise.resolve([
      { id: '10', nom: 'Université de Libreville' },
      { id: '11', nom: 'Institut Sup' },
    ])),
    listOrganisations: vi.fn(() => Promise.resolve([{ id: '20', nom: 'ONG Test' }])),
    listCategories: vi.fn(() => Promise.resolve([])),
  },
}));

const ALL_EDIT_PERMISSIONS = [
  PERMISSIONS.ADMIN_UTILISATEUR_GERER,
  PERMISSIONS.ADMIN_UTILISATEUR_EDIT_IDENTITE,
  PERMISSIONS.ADMIN_UTILISATEUR_EDIT_CONTACT,
  PERMISSIONS.ADMIN_UTILISATEUR_EDIT_ROLE,
  PERMISSIONS.ADMIN_UTILISATEUR_EDIT_RATTACHEMENT,
  PERMISSIONS.ADMIN_UTILISATEUR_EDIT_STATUT,
];

const baseRecord: BackendUser = {
  id: 42,
  username: 'amina.b',
  firstName: 'Amina',
  lastName: 'Bongo',
  email: 'amina.bongo@example.com',
  phoneNumber: '+24106123456',
  role: 'moderateur',
  isActive: true,
  isVerified: true,
  etablissement: 10,
  organisation: 20,
  badges: [{ id: 'b1', nom: 'Pionnière', icone: '🏅', description: 'Parmi les 100 premiers comptes.' }],
};

function makeModel(update = vi.fn((_id: string, values: Record<string, unknown>) => Promise.resolve({ ...baseRecord, ...values } as unknown as BackendUser))) {
  const model = {
    key: 'utilisateur',
    appLabel: 'Utilisateurs',
    labelSingular: 'Utilisateur',
    labelPlural: 'Utilisateurs',
    icon: () => null,
    capabilities: { create: false, edit: true, delete: false },
    fields: [],
    data: { list: () => Promise.resolve([]), get: () => Promise.resolve(baseRecord), update },
  } as unknown as ModelDef<BackendUser>;
  return { model, update };
}

function renderDetail(opts: {
  overrides?: Partial<BackendUser>;
  canManage?: boolean;
  update?: ReturnType<typeof makeModel>['update'];
} = {}) {
  const { model, update } = makeModel(opts.update);
  const onBack = vi.fn();
  const onUpdated = vi.fn();
  const utils = render(
    <UserRecordDetail
      model={model}
      record={{ ...baseRecord, ...opts.overrides }}
      canManage={opts.canManage ?? true}
      onUpdated={onUpdated}
      onBack={onBack}
    />,
  );
  return { ...utils, update, onBack, onUpdated };
}

const tile = (container: HTMLElement, id: string) => container.querySelector<HTMLElement>(`[data-tile="${id}"]`)!;
const clickModifier = () => fireEvent.click(screen.getByRole('button', { name: /modifier/i }));
const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
/** Laisse la résolution asynchrone des libellés FK se terminer (évite un setState après démontage). */
const settle = () => screen.findByText('Université de Libreville');

beforeEach(() => {
  mocks.allowed = new Set<string>(ALL_EDIT_PERMISSIONS);
  mocks.currentUserId = '1';
});

describe('UserRecordDetail — lecture', () => {
  it("affiche le nom, le rôle, les statuts et le nom d'utilisateur", async () => {
    renderDetail();
    expect(screen.getByRole('heading', { name: 'Amina Bongo' })).toBeInTheDocument();
    expect(screen.getByText('@amina.b')).toBeInTheDocument();
    expect(screen.getByText('Modérateur')).toBeInTheDocument();
    expect(screen.getByText('Actif')).toBeInTheDocument();
    expect(screen.getByText('Vérifié')).toBeInTheDocument();
    await settle();
  });

  it("affiche les cadres renseignés, et « Non renseignée » pour une adresse vide", async () => {
    renderDetail({ overrides: { address: undefined } });
    expect(screen.getByText('amina.bongo@example.com')).toBeInTheDocument();
    expect(screen.getByText('Non renseignée')).toBeInTheDocument();
    await settle();
  });

  it('résout et affiche les libellés établissement/organisation par id', async () => {
    renderDetail();
    expect(await screen.findByText('Université de Libreville')).toBeInTheDocument();
    expect(await screen.findByText('ONG Test')).toBeInTheDocument();
  });

  it("masque en lecture les cadres vides (date de naissance) — ils n'apparaissent qu'en édition", async () => {
    const { container } = renderDetail();
    expect(tile(container, 'dateOfBirth')).toBeNull();
    await settle();
  });

  it("affiche les badges de l'utilisateur", async () => {
    renderDetail();
    expect(screen.getByText('Pionnière')).toBeInTheDocument();
    await settle();
  });

  it('déclenche onBack au clic sur le retour', async () => {
    const { onBack } = renderDetail();
    fireEvent.click(screen.getByRole('button', { name: /retour à la liste/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
    await settle();
  });
});

describe('UserRecordDetail — cadre du mot de passe', () => {
  it('est présent en lecture : grisé, étoiles, aucun champ', async () => {
    const { container } = renderDetail();
    const password = tile(container, 'password');
    expect(password).toHaveAttribute('data-tone', 'secret');
    expect(within(password).getByText('Mot de passe')).toBeInTheDocument();
    expect(within(password).getByText('••••••••')).toBeInTheDocument();
    expect(within(password).queryByRole('textbox')).not.toBeInTheDocument();
    await settle();
  });

  it("reste grisé et sans champ EN ÉDITION, avec la mention « Non modifiable ici »", async () => {
    const { container } = renderDetail();
    clickModifier();
    const password = tile(container, 'password');
    expect(password).toHaveAttribute('data-tone', 'secret');
    expect(within(password).getByText('••••••••')).toBeInTheDocument();
    expect(within(password).getByText('Non modifiable ici')).toBeInTheDocument();
    expect(within(password).queryByRole('textbox')).not.toBeInTheDocument();
    await settle();
  });
});

describe('UserRecordDetail — édition en place', () => {
  it("n'affiche pas « Modifier » sans droit de gestion", async () => {
    renderDetail({ canManage: false });
    expect(screen.queryByRole('button', { name: /modifier/i })).not.toBeInTheDocument();
    await settle();
  });

  it('transforme les MÊMES cadres en champs préremplis', async () => {
    const { container } = renderDetail();
    const emailFrame = tile(container, 'email');
    clickModifier();

    // Même cadre (même nœud DOM), désormais un champ.
    expect(tile(container, 'email')).toBe(emailFrame);
    expect(screen.getByLabelText('Email')).toHaveValue('amina.bongo@example.com');
    expect(screen.getByLabelText('Téléphone')).toHaveValue('+24106123456');
    expect(screen.getByLabelText('Prénom')).toHaveValue('Amina');
    expect(screen.getByLabelText('Nom')).toHaveValue('Bongo');
    expect(screen.getByRole('heading', { name: /modifier — amina bongo/i })).toBeInTheDocument();
    // Les cadres vides en lecture apparaissent, pour pouvoir être renseignés.
    expect(tile(container, 'dateOfBirth')).not.toBeNull();
    await settle();
  });

  it("garde les données système (dates, langue) en lecture seule", async () => {
    const { container } = renderDetail({ overrides: { languagePreference: 'fr', timezone: 'Africa/Libreville' } });
    clickModifier();
    const locale = tile(container, 'locale');
    expect(locale).toHaveAttribute('data-tone', 'system');
    expect(within(locale).queryByRole('textbox')).not.toBeInTheDocument();
    await settle();
  });

  it('« Enregistrer » est inactif tant que rien ne change, puis compte les modifications', async () => {
    renderDetail();
    clickModifier();
    const save = screen.getByRole('button', { name: 'Enregistrer' });
    expect(save).toBeDisabled();
    expect(screen.getByText('Aucune modification')).toBeInTheDocument();

    type('Email', 'nouveau@example.com');
    expect(save).toBeEnabled();
    expect(screen.getByText('1 modification non enregistrée')).toBeInTheDocument();

    type('Prénom', 'Amina-Lou');
    expect(screen.getByText('2 modifications non enregistrées')).toBeInTheDocument();
    await settle();
  });

  it('marque le cadre modifié', async () => {
    const { container } = renderDetail();
    clickModifier();
    type('Email', 'nouveau@example.com');
    expect(within(tile(container, 'email')).getByText('Modifié, non enregistré')).toBeInTheDocument();
    expect(within(tile(container, 'phoneNumber')).queryByText('Modifié, non enregistré')).not.toBeInTheDocument();
    await settle();
  });

  it("enregistre UNIQUEMENT les champs modifiés, puis revient à la lecture", async () => {
    const { update, onUpdated } = renderDetail();
    clickModifier();
    type('Email', ' Nouveau@Example.com ');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update).toHaveBeenCalledWith('42', { email: 'nouveau@example.com' });
    await waitFor(() => expect(onUpdated).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument());
    await settle();
  });

  it('permet de VIDER un établissement (— Aucun(e) —) : la valeur vide part dans le patch', async () => {
    const { update } = renderDetail();
    clickModifier();
    fireEvent.click(await screen.findByRole('button', { name: 'Établissement' }));
    fireEvent.click(await screen.findByRole('button', { name: /aucun\(e\)/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(update).toHaveBeenCalledWith('42', { etablissement: '' }));
  });

  it('change le rôle et bascule un statut depuis la bannière', async () => {
    const { update } = renderDetail();
    clickModifier();

    fireEvent.click(screen.getByRole('button', { name: /rôle : modérateur/i }));
    fireEvent.click(await screen.findByRole('option', { name: /étudiant/i }));
    fireEvent.click(screen.getByRole('switch', { name: 'Compte vérifié' }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(update).toHaveBeenCalledWith('42', { role: 'etudiant', isVerified: false }));
    await settle();
  });
});

describe('UserRecordDetail — validation et erreurs', () => {
  it("bloque l'enregistrement et signale un email invalide dans son cadre", async () => {
    const { update } = renderDetail();
    clickModifier();
    type('Email', 'pas-un-email');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Saisissez un email valide.')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(update).not.toHaveBeenCalled();
    await settle();
  });

  it("efface l'erreur d'un champ dès qu'on le corrige", async () => {
    renderDetail();
    clickModifier();
    type('Email', 'pas-un-email');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await screen.findByText('Saisissez un email valide.');

    type('Email', 'ok@example.com');
    expect(screen.queryByText('Saisissez un email valide.')).not.toBeInTheDocument();
    await settle();
  });

  it('rattache une erreur 400 du backend au cadre concerné et reste en édition', async () => {
    const update = vi.fn(() => Promise.reject(
      new ApiError('Bad Request', 400, undefined, '/users/v1/users/42/', { email: ['Un compte existe déjà avec cet email.'] }),
    ));
    const { container } = renderDetail({ update: update as never });
    clickModifier();
    type('Email', 'pris@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await within(tile(container, 'email')).findByText('Un compte existe déjà avec cet email.')).toBeInTheDocument();
    // Bandeau global + valeur saisie conservée pour être corrigée.
    expect(screen.getByText(/certains champs sont invalides/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue('pris@example.com');
    await settle();
  });
});

describe('UserRecordDetail — annulation', () => {
  it("annule sans confirmation quand rien n'a changé", async () => {
    renderDetail();
    clickModifier();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument();
    expect(screen.queryByText('Abandonner les modifications ?')).not.toBeInTheDocument();
    await settle();
  });

  it('demande confirmation si des modifications existent, puis les abandonne', async () => {
    renderDetail();
    clickModifier();
    type('Email', 'autre@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(await screen.findByText('Abandonner les modifications ?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner' }));

    expect(screen.getByRole('button', { name: /modifier/i })).toBeInTheDocument();
    // Les valeurs d'origine sont restaurées pour la prochaine édition.
    clickModifier();
    expect(screen.getByLabelText('Email')).toHaveValue('amina.bongo@example.com');
    await settle();
  });

  it("garde l'édition ouverte si on refuse d'abandonner", async () => {
    renderDetail();
    clickModifier();
    type('Email', 'autre@example.com');
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    await screen.findByText('Abandonner les modifications ?');

    // Deux boutons « Annuler » : celui de la barre, puis celui de la boîte de
    // confirmation (rendue en portail sur <body>, donc APRÈS dans le DOM).
    const cancelButtons = screen.getAllByRole('button', { name: 'Annuler' });
    fireEvent.click(cancelButtons[cancelButtons.length - 1]);
    expect(screen.getByLabelText('Email')).toHaveValue('autre@example.com');
    await settle();
  });

  it('le retour à la liste passe aussi par la confirmation quand il y a des modifications', async () => {
    const { onBack } = renderDetail();
    clickModifier();
    type('Email', 'autre@example.com');
    fireEvent.click(screen.getByRole('button', { name: /retour à la liste/i }));
    expect(onBack).not.toHaveBeenCalled();

    fireEvent.click(await screen.findByRole('button', { name: 'Abandonner' }));
    expect(onBack).toHaveBeenCalledTimes(1);
    await settle();
  });
});

describe('UserRecordDetail — permissions par champ', () => {
  it('sans aucune permission d\'édition de champ, « Modifier » est absent même avec canManage', async () => {
    mocks.allowed = new Set<string>([PERMISSIONS.ADMIN_UTILISATEUR_GERER]);
    renderDetail();
    expect(screen.queryByRole('button', { name: /modifier/i })).not.toBeInTheDocument();
    await settle();
  });

  it("verrouille (sans les masquer) les champs dont la permission manque", async () => {
    mocks.allowed = new Set<string>([PERMISSIONS.ADMIN_UTILISATEUR_GERER, PERMISSIONS.ADMIN_UTILISATEUR_EDIT_CONTACT]);
    const { container } = renderDetail();
    clickModifier();

    // Contact : modifiable.
    expect(screen.getByLabelText('Email')).toBeEnabled();
    // Identité : verrouillée, nom affiché en clair, pas de champ Prénom/Nom.
    expect(screen.queryByLabelText('Prénom')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Amina Bongo' })).toBeInTheDocument();
    // Rattachement : cadre présent, verrouillé, avec la raison.
    const etab = tile(container, 'etablissement');
    expect(etab).toHaveAttribute('data-tone', 'locked');
    expect(within(etab).getByText("Vous n'avez pas la permission de modifier ce champ.")).toBeInTheDocument();
    // Rôle et statuts : simples pastilles, pas de contrôles.
    expect(screen.queryByRole('button', { name: /rôle :/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    await settle();
  });

  it('empêche de modifier son PROPRE rôle et de désactiver son propre compte', async () => {
    mocks.currentUserId = '42'; // même id que la fiche consultée
    renderDetail();
    clickModifier();

    expect(screen.queryByRole('button', { name: /rôle :/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'Compte actif' })).not.toBeInTheDocument();
    // Le statut « vérifié » reste, lui, modifiable.
    expect(screen.getByRole('switch', { name: 'Compte vérifié' })).toBeInTheDocument();
    await settle();
  });
});
