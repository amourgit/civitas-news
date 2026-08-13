import { describe, it, expect } from 'vitest';
import { CommentaireSchema } from '../commentaire.types';

/**
 * Régression : CommentaireSerializer (Backend-Core-Base,
 * commentaires/api/v1/serializers.py) renvoie `audioDuration: null`
 * pour TOUT commentaire texte (l'immense majorité — seul un message
 * vocal a une durée). `z.number().nonnegative().optional()` rejette
 * `null` (accepte uniquement `undefined`), ce qui faisait échouer la
 * validation de CHAQUE commentaire texte, et donc de la page entière
 * de résultats paginés qui le contient (un item invalide invalide tout
 * le tableau) — symptôme observé : le fil de discussion reste vide
 * alors que des commentaires existent bien en base.
 */
describe('CommentaireSchema — contrat réel du backend', () => {
  const utilisateurValide = {
    id: '2',
    username: 'amina_k',
    nomAffiche: 'Amina K.',
    avatar: null,
    role: 'etudiant' as const,
    etablissement: null,
    email: 'amina.k@civitas-news.local',
    badges: [{ id: '1', nom: 'Contributeur actif', icone: '🌟', description: 'Participe régulièrement.' }],
    stats: { contributions: 3, votes: 5, commentaires: 3 },
  };

  const commentaireTexteValide = {
    id: '1',
    newsId: '1',
    sujetId: '1',
    auteur: utilisateurValide,
    typeContenu: 'texte' as const,
    audioUrl: null,
    audioDuration: null, // <- forme réelle renvoyée par le backend pour un commentaire texte
    contenu: 'Un commentaire tout à fait normal.',
    media: [],
    reponseA: null,
    mentions: [],
    reactions: {},
    userReactions: [],
    votes: 0,
    userVoteStatus: null,
    estEpingle: false,
    estReponseAcceptee: false,
    estAdministrateur: false,
    createdAt: '2026-08-12T23:07:57.472471Z',
  };

  it('accepte un commentaire texte avec audioDuration=null (forme réelle backend)', () => {
    const result = CommentaireSchema.safeParse(commentaireTexteValide);
    expect(result.success).toBe(true);
  });

  it("accepte un badge dont l'id est une chaîne (BadgeSerializer forcé en CharField côté backend)", () => {
    const result = CommentaireSchema.safeParse(commentaireTexteValide);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.auteur.badges[0].id).toBe('1');
    }
  });

  it('accepte toujours un commentaire audio avec une durée numérique', () => {
    const result = CommentaireSchema.safeParse({
      ...commentaireTexteValide,
      typeContenu: 'audio',
      audioUrl: 'https://example.com/audio.webm',
      audioDuration: 42,
    });
    expect(result.success).toBe(true);
  });

  it('rejette toujours un badge dont l\'id est un nombre brut (garde-fou anti-régression backend)', () => {
    const result = CommentaireSchema.safeParse({
      ...commentaireTexteValide,
      auteur: { ...utilisateurValide, badges: [{ ...utilisateurValide.badges[0], id: 1 }] },
    });
    expect(result.success).toBe(false);
  });
});
