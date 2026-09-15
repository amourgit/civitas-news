// ============================================================
// src/components/backoffice/__tests__/BackofficeSidebarUtilisateurs.test.tsx
// Régression : l'entrée « Utilisateurs » du panneau de navigation du
// backoffice était bien générée par le registre, mais restait
// invisible/inatteignable à l'usage -- la liste (12 entrées en
// text-4xl + md:py-8) débordait sous le bas de l'écran alors que le
// scroll du body est verrouillé pendant l'ouverture du panneau, et
// qu'aucun conteneur n'était défilant.
//
// Ce test verrouille les deux aspects :
//  1. l'entrée existe pour un administrateur et pointe bien vers
//     /admin/utilisateur (la route servie par BackofficeListPage) ;
//  2. la liste de navigation reste défilante, pour que les entrées
//     basses (Signalements/Utilisateurs/Journal) restent atteignables
//     quel que soit le nombre de tables du registre.
// ============================================================

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { BackofficeSidebar } from '../BackofficeSidebar';

// Le panneau filtre ses entrées par permission (usePermissions ->
// auth.store) : on force un administrateur, seul rôle porteur de
// ADMIN_UTILISATEUR_GERER dans la matrice actuelle.
vi.mock('../../../store/auth.store', () => ({
  useAuthStore: () => ({
    user: { id: '1', nomAffiche: 'Admin Test', username: 'admin', role: 'administrateur' },
    isAdmin: true,
  }),
}));

function renderSidebar() {
  render(
    <MemoryRouter>
      <BackofficeSidebar isMobileOpen onCloseMobile={() => {}} />
    </MemoryRouter>,
  );
  return screen.getByRole('dialog', { name: /navigation du backoffice/i });
}

describe('BackofficeSidebar — entrée Utilisateurs', () => {
  it('expose une entrée « Utilisateurs » pointant vers /admin/utilisateur', () => {
    const dialog = renderSidebar();
    // Le libellé est éclaté en spans par lettre (animation au survol) :
    // on cible par nom accessible, pas par getByText.
    const lien = within(dialog).getByRole('link', { name: /utilisateurs/i });
    expect(lien).toHaveAttribute('href', '/admin/utilisateur');
  });

  it('rend la liste de navigation défilante (entrées basses atteignables)', () => {
    const dialog = renderSidebar();
    const lien = within(dialog).getByRole('link', { name: /utilisateurs/i });
    const conteneurDefilant = lien.closest('section');
    expect(conteneurDefilant).not.toBeNull();
    expect(conteneurDefilant!.className).toContain('overflow-y-auto');
    // min-h-0 : sans lui, l'enfant flex garde min-height:auto et refuse
    // de rétrécir -> overflow-y-auto resterait sans effet.
    expect(conteneurDefilant!.className).toContain('min-h-0');
  });
});
