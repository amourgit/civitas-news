// ============================================================
// src/features/news/creation/buildPreviewNews.ts
// Construit un objet News "à blanc" à partir de l'état courant du
// formulaire de création/édition (voir useNewsCreationForm), pour la
// prévisualisation locale (NewsCreationDock -> "Visualiser", voir
// NewsPreviewModal.tsx) : AUCUN enregistrement, AUCUN appel réseau --
// uniquement les données déjà en mémoire côté formulaire, réassemblées
// dans la forme attendue par NewsCard (le composant qui liste les News
// sur /news, réutilisé tel quel pour l'aperçu). Les champs sans
// équivalent dans le formulaire (stats, réactions, id/slug réels)
// sont neutralisés à zéro/vide -- voir NewsCard.isPreview pour les
// interactions désactivées en conséquence.
// ============================================================

import type { Categorie, News, Utilisateur } from '../../../types/global.types';
import type { NewsCreationForm } from './useNewsCreationForm';
import { extractPlainTextSummary } from './components/ContentEditorField';

const CATEGORIE_APERCU: Categorie = {
  id: 'apercu',
  nom: 'Non classé',
  couleur: '#5B4DFF',
  icone: 'tag',
};

/** Auteur de repli si l'aperçu est ouvert sans session active -- le
 * formulaire de création reste accessible sans connexion (voir
 * useNewsCreationForm : `auteur: user || undefined` à l'enregistrement
 * réel), mais NewsCard.auteur n'est lui jamais optionnel. */
const AUTEUR_APERCU: Utilisateur = {
  id: 'apercu',
  username: 'vous',
  nomAffiche: 'Vous',
  avatar: null,
  role: null,
  etablissement: null,
  badges: [],
  stats: { contributions: 0, votes: 0, commentaires: 0 },
};

export function buildPreviewNews(form: NewsCreationForm): News {
  const categorie = form.categories.find((c) => c.id === form.categorieId) || CATEGORIE_APERCU;
  const organisation = form.organisations.find((o) => o.id === form.organisationId) || null;
  const etablissement = form.etablissements.find((e) => e.id === form.etablissementId) || null;
  const now = new Date().toISOString();

  return {
    // Un id/slug réel (mode édition) reste porté tel quel : ne change
    // rien à l'aperçu lui-même, seulement utile si NewsCard venait à en
    // dépendre ailleurs -- les interactions qui l'exploiteraient
    // réellement (réaction, commentaires, menu) sont de toute façon
    // désactivées par isPreview.
    id: form.existingNewsId || 'apercu',
    slug: 'apercu',
    type: form.type,
    titre: form.titre.trim() || 'Sans titre',
    description: extractPlainTextSummary(form.descriptionCourteJson) || 'Aucun résumé pour le moment.',
    contenu: form.contenuJson,
    image: form.coverPreviewUrl || '',
    galerie: form.galleryDisplayItems.map((g) => ({ url: g.previewUrl })),
    auteur: form.user || AUTEUR_APERCU,
    organisation,
    etablissement,
    categorie,
    tags: form.tags,
    province: form.province,
    lieu: form.lieu || undefined,
    dateDebut: form.dateDebut ? new Date(form.dateDebut).toISOString() : null,
    dateFin: form.dateFin ? new Date(form.dateFin).toISOString() : null,
    createdAt: now,
    updatedAt: now,
    statut: 'brouillon',
    visibilite: form.visibilite,
    stats: {
      vues: 0,
      commentaires: 0,
      reactions: { coeur: 0, jaime: 0, bravo: 0, youpi: 0, wow: 0, jaimepas: 0 },
      votes: 0,
      partages: 0,
    },
    userReaction: null,
    reacteursRecents: [],
  };
}
