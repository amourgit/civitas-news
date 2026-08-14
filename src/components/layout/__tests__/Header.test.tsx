import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Header } from '../Header';

/**
 * Régression : la topbar (Header, montée globalement — voir App.tsx)
 * n'exposait auparavant AUCUNE action de connexion. Un visiteur anonyme
 * n'avait donc aucun moyen évident d'accéder à /auth/login depuis le
 * reste du site, en dehors d'un lien enfoui dans /profil.
 */
describe('Header — action de connexion pour un visiteur anonyme', () => {
  it('affiche un lien "Se connecter" vers /auth/login quand aucune session n\'est active', async () => {
    render(
      <MemoryRouter initialEntries={['/news']}>
        <Header />
      </MemoryRouter>
    );

    // Le store d'auth s'hydrate de façon asynchrone (voir auth.store.ts) ;
    // sans cookie de session, il retombe immédiatement sur l'état anonyme.
    const loginLink = await waitFor(() => screen.getByTitle('Se connecter'));
    expect(loginLink.tagName).toBe('A');
    expect(loginLink.getAttribute('href')).toBe('/auth/login');
  });
});

/**
 * Garde d'authentification globale : dès que l'hydratation de la session
 * est terminée sans qu'une session valide n'ait été restaurée, la topbar
 * doit renvoyer IMMÉDIATEMENT (sans confirmation) vers /auth/login, quelle
 * que soit la page sur laquelle elle est montée — voir le useEffect dédié
 * dans Header.tsx.
 */
describe('Header — redirection automatique sans session valide', () => {
  it('redirige vers /auth/login une fois l\'hydratation terminée si aucune session n\'est active', async () => {
    render(
      <MemoryRouter initialEntries={['/news']}>
        <Routes>
          <Route path="/auth/login" element={<div>PAGE_LOGIN</div>} />
          <Route path="*" element={<Header />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText('PAGE_LOGIN'));
  });
});
