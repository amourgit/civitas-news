// ============================================================
// src/components/backoffice/registry/models/commentaire.registry.ts
// ============================================================

import { MessageSquare } from 'lucide-react';
import type { ModelDef } from '../types';
import type { Commentaire } from '../../../../types/global.types';
import { commentsRepository } from '../../../../services/api/repositories/comments.repository';
import { PERMISSIONS } from '../../../../lib/permissions/permissions.catalog';

export const commentaireModel: ModelDef<Commentaire> = {
  key: 'commentaire',
  appLabel: 'Interactions',
  labelSingular: 'Commentaire',
  labelPlural: 'Commentaires',
  icon: MessageSquare,
  description: "Fils de discussion sous les News — création réservée à l'auteur, édition/suppression au backoffice.",
  viewPermission: PERMISSIONS.COMMENTAIRE_VIEW,
  managePermission: PERMISSIONS.BACKOFFICE_COMMENTAIRE_MANAGE,
  // Un commentaire naît toujours rattaché à une News précise (pas de
  // création "à froid" depuis une table générique) : pas de bouton
  // "Ajouter" ici, seulement consultation/édition/suppression.
  capabilities: { create: false, edit: true, delete: true },
  searchFields: ['contenu'],
  fields: [
    { name: 'contenu', label: 'Contenu', type: 'textarea', required: true },
    { name: 'typeContenu', label: 'Type', type: 'select', readOnly: true, options: [
      { value: 'texte', label: 'Texte' },
      { value: 'audio', label: 'Audio' },
    ] },
    { name: 'newsId', label: 'News', type: 'fk', readOnly: true, fkTarget: 'news', fkLabelField: 'titre' },
    { name: 'auteur', label: 'Auteur', type: 'badge', readOnly: true,
      renderList: (_v, record) => record.auteur?.nomAffiche ?? record.auteur?.username ?? '—' },
    { name: 'reponseA', label: 'Réponse à', type: 'text', readOnly: true, hiddenInList: true },
    { name: 'votes', label: 'Votes', type: 'number', readOnly: true, hiddenInForm: true },
    { name: 'estEpingle', label: 'Épinglé', type: 'boolean', readOnly: true },
    { name: 'estAdministrateur', label: 'Auteur admin', type: 'boolean', readOnly: true, hiddenInList: true },
    { name: 'createdAt', label: 'Créé le', type: 'datetime', readOnly: true, hiddenInForm: true },
  ],
  data: {
    list: () => commentsRepository.list(),
    get: (id) => commentsRepository.getById(id),
    update: (id, values) => commentsRepository.update(id, {
      contenu: values.contenu as string,
    }),
    remove: (id) => commentsRepository.remove(id),
  },
};
