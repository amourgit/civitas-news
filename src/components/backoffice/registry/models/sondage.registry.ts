// ============================================================
// src/components/backoffice/registry/models/sondage.registry.ts
// ============================================================

import { BarChart3 } from 'lucide-react';
import type { ModelDef } from '../types';
import type { Sondage } from '../../../../types/global.types';
import { sondagesRepository } from '../../../../services/api/repositories/sondages.repository';
import { PERMISSIONS } from '../../../../lib/permissions/permissions.catalog';

export const sondageModel: ModelDef<Sondage> = {
  key: 'sondage',
  appLabel: 'Interactions',
  labelSingular: 'Sondage',
  labelPlural: 'Sondages',
  icon: BarChart3,
  description: 'Sondages rattachés à une News.',
  viewPermission: PERMISSIONS.SONDAGE_VIEW,
  managePermission: PERMISSIONS.BACKOFFICE_SONDAGE_MANAGE,
  capabilities: { create: false, edit: true, delete: true },
  searchFields: ['titre', 'question'],
  fields: [
    { name: 'titre', label: 'Titre', type: 'text', required: true },
    { name: 'question', label: 'Question', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea', hiddenInList: true },
    { name: 'newsId', label: 'News', type: 'fk', readOnly: true, fkTarget: 'news', fkLabelField: 'titre' },
    { name: 'statut', label: 'Statut', type: 'select', options: [
      { value: 'actif', label: 'Actif' },
      { value: 'programme', label: 'Programmé' },
      { value: 'termine', label: 'Terminé' },
      { value: 'archive', label: 'Archivé' },
    ] },
    { name: 'typeVote', label: 'Type de vote', type: 'select', options: [
      { value: 'unique', label: 'Choix unique' },
      { value: 'multiple', label: 'Choix multiple' },
    ] },
    { name: 'anonymat', label: 'Anonyme', type: 'boolean' },
    { name: 'visibiliteResultat', label: 'Visibilité des résultats', type: 'select', options: [
      { value: 'instantane', label: 'Instantanée' },
      { value: 'masque_jusqua_fin', label: "Masquée jusqu'à la fin" },
    ] },
    { name: 'dateDebut', label: 'Date de début', type: 'datetime', required: true },
    { name: 'dateFin', label: 'Date de fin', type: 'datetime', required: true },
    { name: 'choix', label: 'Options (lecture seule)', type: 'json-readonly', readOnly: true, hiddenInList: true,
      helpText: "Les options d'un sondage ne sont modifiables qu'à sa création (contrainte backend, voir sondagesRepository.update)." },
    { name: 'totalVotes', label: 'Total votes', type: 'number', readOnly: true, hiddenInForm: true },
    { name: 'createdAt', label: 'Créé le', type: 'datetime', readOnly: true, hiddenInForm: true },
  ],
  data: {
    list: () => sondagesRepository.list(),
    get: (id) => sondagesRepository.getById(id),
    update: (id, values) => sondagesRepository.update(id, {
      titre: values.titre as string,
      description: (values.description as string) || undefined,
      question: values.question as string,
      dateDebut: values.dateDebut as string,
      dateFin: values.dateFin as string,
      typeVote: values.typeVote as Sondage['typeVote'],
      anonymat: values.anonymat as boolean,
      visibiliteResultat: values.visibiliteResultat as Sondage['visibiliteResultat'],
      statut: values.statut as Sondage['statut'],
    }),
    remove: (id) => sondagesRepository.remove(id),
  },
};
