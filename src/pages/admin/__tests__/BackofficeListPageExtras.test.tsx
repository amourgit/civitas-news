// ============================================================
// src/pages/admin/__tests__/BackofficeListPageExtras.test.tsx
// Verrouille le placement de ModelDef.ListExtras sur la page liste :
//  - listExtrasMode: 'replace' (Utilisateurs) -> le carrousel est la
//    vue liste, le tableau générique n'est PAS rendu ;
//  - défaut (autres modèles, ex. Catégories) -> le tableau reste rendu.
// Régression utile : le mode 'replace' retire au passage la recherche,
// la création et la suppression portées par le tableau -- un
// basculement involontaire d'un autre modèle vers ce mode doit sauter
// aux yeux.
// ============================================================

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import BackofficeListPage from '../BackofficeListPage';

vi.mock('../../../store/auth.store', () => ({
  useAuthStore: () => ({
    user: { id: '1', nomAffiche: 'Admin Test', username: 'admin', role: 'administrateur' },
    isAdmin: true,
  }),
}));

// Le carrousel et le tableau sont testés séparément : on ne veut ici
// que vérifier LEQUEL est monté, sans dépendre de leurs internes.
vi.mock('../../../components/backoffice/users/UserOrbitCarousel', () => ({
  default: () => <div data-testid="carrousel-utilisateurs" />,
}));
vi.mock('../../../components/backoffice/BackofficeDataTable', () => ({
  BackofficeDataTable: () => <div data-testid="tableau-generique" />,
}));

function renderListe(modelKey: string) {
  render(
    <MemoryRouter initialEntries={[`/admin/${modelKey}`]}>
      <Routes>
        <Route path="/admin/:modelKey" element={<BackofficeListPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('BackofficeListPage — placement de ListExtras', () => {
  it("Utilisateurs : le carrousel remplace le tableau générique", async () => {
    renderListe('utilisateur');
    expect(await screen.findByTestId('carrousel-utilisateurs')).toBeInTheDocument();
    expect(screen.queryByTestId('tableau-generique')).not.toBeInTheDocument();
  });

  it('Modèle sans extras : le tableau générique reste la vue liste', async () => {
    renderListe('categorie');
    expect(await screen.findByTestId('tableau-generique')).toBeInTheDocument();
    expect(screen.queryByTestId('carrousel-utilisateurs')).not.toBeInTheDocument();
  });
});
