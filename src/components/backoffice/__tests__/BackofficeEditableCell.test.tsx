// ============================================================
// src/components/backoffice/__tests__/BackofficeEditableCell.test.tsx
// Verrouille le comportement central de l'édition en ligne : clic sur
// une cellule -> modification -> `model.data.update` reçoit
// l'enregistrement complet fusionné (même forme que le formulaire de
// détail, voir buildInitialValues) -> la liste locale est mise à jour
// via `onRecordUpdated`. Couvre un champ par grande famille
// d'interaction (texte in-situ, booléen instantané, select en menu
// déroulant) + la non-régression de l'affichage en lecture seule.
// ============================================================

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Info } from 'lucide-react';
import { BackofficeDataTable } from '../BackofficeDataTable';
import type { ModelDef } from '../registry/types';

interface FakeRecord extends Record<string, unknown> {
  id: string;
  titre: string;
  statut: string;
  actif: boolean;
}

const baseRecord: FakeRecord = { id: '1', titre: 'Premier', statut: 'brouillon', actif: false };

function buildModel(update: (id: string, payload: Record<string, unknown>) => Promise<FakeRecord>): ModelDef<FakeRecord> {
  return {
    key: 'news',
    appLabel: 'Test',
    labelSingular: 'Élément',
    labelPlural: 'Éléments',
    icon: Info,
    capabilities: { create: true, edit: true, delete: true },
    fields: [
      { name: 'titre', label: 'Titre', type: 'text', required: true },
      {
        name: 'statut',
        label: 'Statut',
        type: 'select',
        options: [
          { value: 'brouillon', label: 'Brouillon' },
          { value: 'publie', label: 'Publié' },
        ],
      },
      { name: 'actif', label: 'Actif', type: 'boolean' },
    ],
    data: {
      list: () => Promise.resolve([]),
      update,
    },
  };
}

function renderTable(model: ModelDef<FakeRecord>, onRecordUpdated = vi.fn()) {
  return render(
    <BackofficeDataTable
      model={model}
      records={[baseRecord]}
      isLoading={false}
      canManage
      onCreate={() => {}}
      onOpen={() => {}}
      onDelete={() => {}}
      onRecordUpdated={onRecordUpdated}
    />,
  );
}

describe('Édition en ligne du tableau backoffice', () => {
  it('modifie un champ texte au clic, Entrée pour enregistrer, envoie l’enregistrement complet fusionné', async () => {
    const updated = { ...baseRecord, titre: 'Modifié' };
    const update = vi.fn().mockResolvedValue(updated);
    const onRecordUpdated = vi.fn();
    renderTable(buildModel(update), onRecordUpdated);

    fireEvent.click(screen.getByText('Premier'));
    const input = await screen.findByDisplayValue('Premier');
    fireEvent.change(input, { target: { value: 'Modifié' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({ titre: 'Modifié', statut: 'brouillon', actif: false }),
    );
    expect(onRecordUpdated).toHaveBeenCalledWith(updated);
  });

  it('n’enregistre rien si la valeur n’a pas changé (blur sans modification)', async () => {
    const update = vi.fn();
    renderTable(buildModel(update));

    fireEvent.click(screen.getByText('Premier'));
    const input = await screen.findByDisplayValue('Premier');
    fireEvent.blur(input);

    await waitFor(() => expect(screen.getByText('Premier')).toBeInTheDocument());
    expect(update).not.toHaveBeenCalled();
  });

  it('bascule un champ booléen au clic, immédiatement (sans étape de saisie)', async () => {
    const updated = { ...baseRecord, actif: true };
    const update = vi.fn().mockResolvedValue(updated);
    const onRecordUpdated = vi.fn();
    renderTable(buildModel(update), onRecordUpdated);

    fireEvent.click(screen.getByText('Non'));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update).toHaveBeenCalledWith('1', expect.objectContaining({ actif: true }));
    expect(onRecordUpdated).toHaveBeenCalledWith(updated);
  });

  it('modifie un champ select via le menu déroulant (chargement des options du registre)', async () => {
    const updated = { ...baseRecord, statut: 'publie' };
    const update = vi.fn().mockResolvedValue(updated);
    const onRecordUpdated = vi.fn();
    renderTable(buildModel(update), onRecordUpdated);

    fireEvent.click(screen.getByText('Brouillon'));
    const option = await screen.findByText('Publié');
    fireEvent.click(option);

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update).toHaveBeenCalledWith('1', expect.objectContaining({ statut: 'publie' }));
    expect(onRecordUpdated).toHaveBeenCalledWith(updated);
  });

  it('ne rend aucun contrôle interactif quand canManage=false (affichage historique inchangé)', () => {
    const update = vi.fn();
    render(
      <BackofficeDataTable
        model={buildModel(update)}
        records={[baseRecord]}
        isLoading={false}
        canManage={false}
        onCreate={() => {}}
        onOpen={() => {}}
        onDelete={() => {}}
        onRecordUpdated={() => {}}
      />,
    );

    expect(screen.getByText('Premier')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^non$/i })).not.toBeInTheDocument();
  });
});
