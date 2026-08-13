import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
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
