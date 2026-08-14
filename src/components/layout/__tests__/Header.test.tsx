import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '../Header';
import LoginModal from '../../auth/LoginModal';

/**
 * La connexion est STRICTEMENT OPTIONNELLE (voir LoginModal.tsx) :
 * aucune route ni requête n'exige de session. La topbar (montée
 * globalement, voir App.tsx) expose simplement un bouton "Se connecter"
 * qui ouvre le popup de connexion — jamais une redirection forcée, et
 * jamais un lien vers une page dédiée (supprimée).
 */
describe('Header — action de connexion pour un visiteur anonyme', () => {
  it('affiche un bouton "Se connecter" (pas un lien vers une page) quand aucune session n\'est active', async () => {
    render(
      <MemoryRouter initialEntries={['/news']}>
        <Header />
      </MemoryRouter>
    );

    // Le store d'auth s'hydrate de façon asynchrone (voir auth.store.ts) ;
    // sans cookie de session, il retombe immédiatement sur l'état anonyme.
    const loginButton = await waitFor(() => screen.getByTitle('Se connecter'));
    expect(loginButton.tagName).toBe('BUTTON');
  });

  it('ouvre le popup de connexion au clic, sans jamais naviguer', async () => {
    render(
      <MemoryRouter initialEntries={['/news']}>
        <Header />
        <LoginModal />
      </MemoryRouter>
    );

    const loginButton = await waitFor(() => screen.getByTitle('Se connecter'));
    fireEvent.click(loginButton);

    await waitFor(() => screen.getByRole('dialog'));
    expect(screen.getByRole('heading', { name: 'Connexion' })).toBeInTheDocument();
  });
});
