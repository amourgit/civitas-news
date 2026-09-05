import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { BackofficeSidebar } from '../BackofficeSidebar';

describe('BackofficeSidebar — panneau curved navbar', () => {
  it("n'affiche aucun dialogue quand isMobileOpen=false", () => {
    render(
      <MemoryRouter>
        <BackofficeSidebar isMobileOpen={false} onCloseMobile={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('affiche le panneau en dialogue quand isMobileOpen=true, avec le Tableau de bord en tête de liste', () => {
    render(
      <MemoryRouter>
        <BackofficeSidebar isMobileOpen onCloseMobile={() => {}} />
      </MemoryRouter>,
    );
    const dialog = screen.getByRole('dialog', { name: /navigation du backoffice/i });
    expect(dialog).toBeInTheDocument();
    // Le libellé est éclaté en spans par lettre (animation au survol) :
    // on cible le lien par son nom accessible (concaténation du texte),
    // pas par getByText qui ne matche qu'un nœud de texte unique.
    expect(within(dialog).getByRole('link', { name: /tableau/i })).toBeInTheDocument();
  });

  it('appelle onCloseMobile au clic sur une entrée de navigation', () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <BackofficeSidebar isMobileOpen onCloseMobile={onClose} />
      </MemoryRouter>,
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('link', { name: /tableau/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('appelle onCloseMobile à la touche Échap', () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <BackofficeSidebar isMobileOpen onCloseMobile={onClose} />
      </MemoryRouter>,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
