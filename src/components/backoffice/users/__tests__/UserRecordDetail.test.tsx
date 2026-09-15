// ============================================================
// src/components/backoffice/users/__tests__/UserRecordDetail.test.tsx
// Verrouille le nouveau design "profil" de la fiche Utilisateur (voir
// UserRecordDetail.tsx, branché via ModelDef.RecordExtras +
// recordViewMode: 'replace' dans utilisateur.registry.ts) :
//  - la consultation affiche nom, rôle, statuts et informations, sans
//    passer par le formulaire générique ;
//  - les libellés établissement/organisation sont résolus par id (via
//    referentielsRepository, mocké ici) plutôt que d'afficher un id
//    brut ;
//  - le bouton « Modifier » bascule vers BackofficeRecordForm (édition
//    inchangée), et « Annuler » revient à la vue profil.
//
// Un modèle minimal (sans champ 'fk') est utilisé plutôt que le vrai
// utilisateurModel, pour ne pas dépendre du réseau (FkSelectField
// interrogerait de vraies tables du registre) : ce test cible le
// design de CETTE fiche, pas BackofficeRecordForm, déjà testé
// ailleurs.
// ============================================================

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserRecordDetail from '../UserRecordDetail';
import type { ModelDef } from '../../registry/types';
import type { BackendUser } from '../../../../types/models/backend.types';

vi.mock('../../../../services/api/repositories/referentiels.repository', () => ({
  referentielsRepository: {
    getEtablissement: vi.fn(() => Promise.resolve({ id: '10', nom: 'Université de Libreville' })),
    getOrganisation: vi.fn(() => Promise.resolve({ id: '20', nom: 'ONG Test' })),
  },
}));

const stubModel: ModelDef<BackendUser> = {
  key: 'utilisateur',
  appLabel: 'Utilisateurs',
  labelSingular: 'Utilisateur',
  labelPlural: 'Utilisateurs',
  icon: () => null,
  capabilities: { create: false, edit: true, delete: false },
  fields: [
    { name: 'firstName', label: 'Prénom', type: 'text' },
    { name: 'lastName', label: 'Nom', type: 'text' },
  ],
  data: {
    list: () => Promise.resolve([]),
    get: (id) => Promise.resolve({ id: Number(id) } as unknown as BackendUser),
    update: (_id, values) => Promise.resolve(values as unknown as BackendUser),
  },
} as ModelDef<BackendUser>;

const baseRecord: BackendUser = {
  id: 42,
  username: 'amina.b',
  firstName: 'Amina',
  lastName: 'Bongo',
  email: 'amina.bongo@example.com',
  role: 'moderateur',
  isActive: true,
  isVerified: true,
  etablissement: 10,
  organisation: 20,
  badges: [{ id: 'b1', nom: 'Pionnière', icone: '🏅', description: 'Parmi les 100 premiers comptes.' }],
};

function renderDetail(overrides: Partial<BackendUser> = {}, canManage = true, onBack = vi.fn(), onUpdated = vi.fn()) {
  render(
    <UserRecordDetail
      model={stubModel}
      record={{ ...baseRecord, ...overrides }}
      canManage={canManage}
      onUpdated={onUpdated}
      onBack={onBack}
    />,
  );
  return { onBack, onUpdated };
}

describe('UserRecordDetail — vue profil', () => {
  it('affiche le nom, le rôle, les statuts et le nom d\'utilisateur', () => {
    renderDetail();
    expect(screen.getByRole('heading', { name: 'Amina Bongo' })).toBeInTheDocument();
    expect(screen.getByText('@amina.b')).toBeInTheDocument();
    expect(screen.getByText('Modérateur')).toBeInTheDocument();
    expect(screen.getByText('Actif')).toBeInTheDocument();
    expect(screen.getByText('Vérifié')).toBeInTheDocument();
  });

  it('affiche les tuiles d\'information renseignées et masque les champs vides', async () => {
    renderDetail({ phoneNumber: undefined, address: undefined });
    expect(screen.getByText('amina.bongo@example.com')).toBeInTheDocument();
    // Téléphone non renseigné : le libellé générique s'affiche quand
    // même (InfoTile ne masque que value === falsy, or on passe
    // 'Non renseigné' explicitement pour ce champ) -- on vérifie donc
    // sa présence plutôt que son absence.
    expect(screen.getByText('Non renseigné')).toBeInTheDocument();
    // Laisse la résolution FK (asynchrone) se terminer avant la fin du
    // test, pour ne pas déclencher de setState après démontage.
    await screen.findByText('Université de Libreville');
  });

  it('résout et affiche les libellés établissement/organisation par id', async () => {
    renderDetail();
    expect(await screen.findByText('Université de Libreville')).toBeInTheDocument();
    expect(await screen.findByText('ONG Test')).toBeInTheDocument();
  });

  it('affiche les badges de l\'utilisateur', () => {
    renderDetail();
    expect(screen.getByText('Pionnière')).toBeInTheDocument();
  });

  it('n\'affiche pas le bouton Modifier sans droit de gestion', async () => {
    renderDetail({}, false);
    expect(screen.queryByRole('button', { name: /modifier/i })).not.toBeInTheDocument();
    await screen.findByText('Université de Libreville');
  });

  it('bascule vers le formulaire d\'édition puis revient à la vue profil', () => {
    renderDetail();
    fireEvent.click(screen.getByRole('button', { name: /modifier/i }));
    expect(screen.getByRole('heading', { name: /modifier — amina bongo/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.getByRole('heading', { name: 'Amina Bongo' })).toBeInTheDocument();
  });

  it('déclenche onBack au clic sur le retour, en vue profil', async () => {
    const { onBack } = renderDetail();
    fireEvent.click(screen.getByRole('button', { name: /retour à la liste/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
    await screen.findByText('Université de Libreville');
  });
});
