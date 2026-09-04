import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { BackofficeSidebar } from '../BackofficeSidebar';

describe('BackofficeSidebar — tiroir mobile', () => {
  it("n'affiche aucun dialogue quand isMobileOpen=false", () => {
    render(
      <MemoryRouter>
        <BackofficeSidebar isMobileOpen={false} onCloseMobile={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('affiche le tiroir en dialogue quand isMobileOpen=true', () => {
    render(
      <MemoryRouter>
        <BackofficeSidebar isMobileOpen onCloseMobile={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('dialog', { name: /navigation du backoffice/i })).toBeInTheDocument();
  });

  it('appelle onCloseMobile au clic sur le bouton fermer', () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <BackofficeSidebar isMobileOpen onCloseMobile={onClose} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /fermer la navigation/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('appelle onCloseMobile au clic sur un lien de navigation (referme après navigation)', () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <BackofficeSidebar isMobileOpen onCloseMobile={onClose} />
      </MemoryRouter>,
    );
    // "Tableau de bord" apparaît deux fois dans le DOM (nav desktop
    // masquée en CSS pure `hidden sm:flex`, toujours présente pour
    // jsdom qui n'applique pas les media queries + tiroir mobile) : on
    // cible explicitement le lien À L'INTÉRIEUR du dialogue.
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByText('Tableau de bord'));
    // Le panneau étant désormais global (voir Header.tsx), la fermeture
    // est déclenchée à la fois par le clic (handleNavigate) et par
    // l'effet de changement de route — un double appel inoffensif
    // (idempotent), donc on vérifie "au moins une fois" plutôt qu'un
    // compte exact.
    expect(onClose).toHaveBeenCalled();
  });
});
