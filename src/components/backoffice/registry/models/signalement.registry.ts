// ============================================================
// src/components/backoffice/registry/models/signalement.registry.ts
// ============================================================

import { ShieldAlert } from 'lucide-react';
import type { ModelDef } from '../types';
import type { Signalement } from '../../../../types/global.types';
import { adminRepository } from '../../../../services/api/repositories/admin.repository';
import { PERMISSIONS } from '../../../../lib/permissions/permissions.catalog';

export const signalementModel: ModelDef<Signalement> = {
  key: 'signalement',
  appLabel: 'Modération',
  labelSingular: 'Signalement',
  labelPlural: 'Signalements',
  icon: ShieldAlert,
  description: 'Contenus signalés par les utilisateurs (news, commentaires, sondages, comptes) en attente de traitement.',
  viewPermission: PERMISSIONS.ADMIN_ACCESS,
  managePermission: PERMISSIONS.BACKOFFICE_SIGNALEMENT_MANAGE,
  // Un signalement naît de l'action d'un utilisateur, jamais créé
  // manuellement au backoffice.
  capabilities: { create: false, edit: true, delete: true },
  searchFields: ['titreOuApercu'],
  fields: [
    { name: 'titreOuApercu', label: 'Contenu signalé', type: 'text', required: true },
    { name: 'typeContenu', label: 'Type de contenu', type: 'select', required: true, options: [
      { value: 'news', label: 'News' },
      { value: 'sujet', label: 'Sujet' },
      { value: 'commentaire', label: 'Commentaire' },
      { value: 'utilisateur', label: 'Utilisateur' },
      { value: 'sondage', label: 'Sondage' },
    ] },
    { name: 'motif', label: 'Motif', type: 'select', required: true, options: [
      { value: 'spam', label: 'Spam' },
      { value: 'propos_inappropries', label: 'Propos inappropriés' },
      { value: 'desinformation', label: 'Désinformation' },
      { value: 'harcelement', label: 'Harcèlement' },
      { value: 'autre', label: 'Autre' },
    ] },
    { name: 'description', label: 'Description', type: 'textarea', hiddenInList: true },
    { name: 'auteurSignalement', label: 'Signalé par', type: 'badge', readOnly: true,
      renderList: (_v, record) => record.auteurSignalement?.nomAffiche ?? '—' },
    { name: 'statut', label: 'Statut', type: 'select', options: [
      { value: 'en_attente', label: 'En attente' },
      { value: 'traite', label: 'Traité' },
      { value: 'rejete', label: 'Rejeté' },
    ], helpText: "Passer par les actions rapides « Traiter »/« Rejeter » plutôt que ce champ pour conserver la trace dans le journal d'audit." },
    { name: 'createdAt', label: 'Signalé le', type: 'datetime', readOnly: true, hiddenInForm: true },
  ],
  data: {
    list: () => adminRepository.getSignalements(),
    get: (id) => adminRepository.getSignalementById(id),
    update: (id, values) => adminRepository.updateSignalement(id, {
      titreOuApercu: values.titreOuApercu as string,
      typeContenu: values.typeContenu as Signalement['typeContenu'],
      motif: values.motif as Signalement['motif'],
      description: (values.description as string) || undefined,
    }),
    remove: (id) => adminRepository.removeSignalement(id),
  },
};
