// ============================================================
// src/components/auth/__tests__/TenantSelectButton.test.tsx
// Verrouille le contrat central du sélecteur : le sous-domaine EXACT
// de l'annuaire (GET /tenants/v1/) est ce qui remonte via onSelect
// comme domainHeaderValue -- c'est cette valeur que LoginModal injecte
// ensuite dans tenants.store (switchTenant), donc ce qui part
// réellement en X-Tenant-Domain sur la tentative de connexion.
// ============================================================

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TenantSelectButton } from '../TenantSelectButton';
import { tenantsRepository } from '../../../services/api/repositories/tenants.repository';

vi.mock('../../../services/api/repositories/tenants.repository', () => ({
  tenantsRepository: {
    list: vi.fn(() =>
      Promise.resolve([
        { id: 1, name: 'Civitas News', sousDomaine: 'civitas' },
        { id: 2, name: 'Mon Campus', sousDomaine: 'moncampus' },
      ])
    ),
  },
}));

describe('TenantSelectButton', () => {
  it("affiche un placeholder sans sélection, puis la liste des organisations actives à l'ouverture", async () => {
    render(<TenantSelectButton value={null} onSelect={vi.fn()} />);
    expect(screen.getByText('Choisir une organisation')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(screen.getByText('Mon Campus')).toBeInTheDocument());
    expect(screen.getByText('Civitas News')).toBeInTheDocument();
  });

  it('injecte le sous-domaine exact comme domainHeaderValue au clic sur une option', async () => {
    const onSelect = vi.fn();
    render(<TenantSelectButton value={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText('Mon Campus'));

    fireEvent.click(screen.getByText('Mon Campus'));

    expect(onSelect).toHaveBeenCalledWith({ domainHeaderValue: 'moncampus', name: 'Mon Campus' });
  });

  it('filtre les organisations via la barre de recherche', async () => {
    render(<TenantSelectButton value={null} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => screen.getByText('Mon Campus'));

    fireEvent.change(screen.getByPlaceholderText('Rechercher une organisation…'), {
      target: { value: 'civitas' },
    });

    expect(screen.getByText('Civitas News')).toBeInTheDocument();
    expect(screen.queryByText('Mon Campus')).not.toBeInTheDocument();
  });

  it('affiche le nom du tenant déjà sélectionné dans le déclencheur', async () => {
    render(
      <TenantSelectButton
        value={{ domainHeaderValue: 'civitas', name: 'Civitas News' }}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText('Civitas News')).toBeInTheDocument();
    // Laisse le fetch interne (liste des organisations) se résoudre
    // avant la fin du test, pour ne pas déclencher un avertissement act().
    await waitFor(() => expect(tenantsRepository.list).toHaveBeenCalled());
  });
});
