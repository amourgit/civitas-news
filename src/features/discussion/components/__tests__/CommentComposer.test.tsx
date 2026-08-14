import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CommentComposer } from '../CommentComposer';

/**
 * Régression : CommentComposer effaçait le texte saisi IMMÉDIATEMENT au
 * clic sur "Envoyer", sans jamais attendre la résolution de `onSubmit`
 * (la vraie requête réseau, voir useComments.ts). En cas d'échec
 * backend, le texte disparaissait quand même, sans aucune erreur
 * visible -- l'utilisateur perdait silencieusement son commentaire.
 * handleSubmit doit désormais `await onSubmit(...)` et ne vider le
 * champ qu'après un succès confirmé.
 */
describe('CommentComposer — envoi réel avec attente du backend', () => {
  it('vide le champ après un envoi réussi', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<CommentComposer onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText('Écrire un commentaire...');
    fireEvent.change(textarea, { target: { value: 'Un premier commentaire' } });
    fireEvent.click(screen.getByTitle('Envoyer le message'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Un premier commentaire'));
    await waitFor(() => expect(textarea).toHaveValue(''));
  });

  it('conserve le texte saisi si onSubmit échoue (jamais de perte silencieuse)', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Erreur réseau'));
    render(<CommentComposer onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText('Écrire un commentaire...');
    fireEvent.change(textarea, { target: { value: 'Ce commentaire ne doit pas se perdre' } });
    fireEvent.click(screen.getByTitle('Envoyer le message'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    // Laisse le temps au catch/finally de handleSubmit de s'exécuter.
    await waitFor(() => expect(textarea).toHaveValue('Ce commentaire ne doit pas se perdre'));
  });

  it('désactive le bouton d\'envoi pendant que la requête est en cours', async () => {
    let resolveSubmit: () => void = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        })
    );
    render(<CommentComposer onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText('Écrire un commentaire...');
    fireEvent.change(textarea, { target: { value: 'En cours d\'envoi' } });
    const sendButton = screen.getByTitle('Envoyer le message');
    fireEvent.click(sendButton);

    await waitFor(() => expect(sendButton).toBeDisabled());
    resolveSubmit();
    await waitFor(() => expect(sendButton).not.toBeDisabled());
  });
});
