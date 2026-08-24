import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import BackofficeRecordPage from '../BackofficeRecordPage';

/**
 * Non-régression : la route ":modelKey/nouveau" (segment STATIQUE
 * "nouveau") ne peuplait jamais le paramètre ":id" -> `isCreate` restait
 * `false` -> le useEffect de chargement s'arrêtait immédiatement sans
 * jamais repasser `isLoading` à `false` -> le formulaire de création ne
 * s'affichait jamais (spinner infini). Corrigé en supprimant cette route
 * dédiée : ":modelKey/:id" gère nativement id="nouveau" comme n'importe
 * quel autre id. Ce test verrouille ce comportement.
 */
describe('BackofficeRecordPage — mode création', () => {
  it('affiche le formulaire (pas le spinner de chargement) quand id="nouveau"', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/categorie/nouveau']}>
        <Routes>
          <Route path="/admin/:modelKey/:id" element={<BackofficeRecordPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // La présence des champs du formulaire ET du bouton "Annuler" prouve
    // que la page est bien sortie de l'état `isLoading` (le formulaire
    // n'est monté qu'une fois `!isLoading && (isCreate || record)`,
    // voir BackofficeRecordPage) — sans dépendre du bouton "Créer",
    // conditionné par une permission (canManage) hors-sujet ici : ce
    // test cible spécifiquement la sortie de l'état de chargement, pas
    // les droits d'édition.
    expect(await screen.findByText(/créer\s*—\s*catégorie/i)).toBeInTheDocument();
    expect(screen.getByText('Nom')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /annuler/i })).toBeInTheDocument();
  });
});
