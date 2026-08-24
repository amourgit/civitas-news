// ============================================================
// src/components/backoffice/registry/models/lien.registry.ts
// ============================================================

import { Link2 } from 'lucide-react';
import type { ModelDef } from '../types';
import type { LienPublication } from '../../../../types/global.types';
import { liensRepository } from '../../../../services/api/repositories/liens.repository';
import { PERMISSIONS } from '../../../../lib/permissions/permissions.catalog';

export const lienModel: ModelDef<LienPublication> = {
  key: 'lien',
  appLabel: 'Diffusion',
  labelSingular: 'Lien de publication',
  labelPlural: 'Liens de publication',
  icon: Link2,
  description: 'Liens de partage générés pour diffuser une News (QR code, portée, expiration).',
  viewPermission: PERMISSIONS.BACKOFFICE_LIEN_MANAGE,
  managePermission: PERMISSIONS.BACKOFFICE_LIEN_MANAGE,
  // Ni mise à jour, ni page de détail éditable : un lien se révoque et
  // se régénère, il ne se modifie pas en place (voir le docstring du
  // ViewSet backend — GET/POST/DELETE uniquement, jamais PATCH).
  capabilities: { create: true, edit: false, delete: true },
  searchFields: ['urlPublique', 'urlCourte'],
  fields: [
    { name: 'newsId', label: 'News', type: 'fk', required: true, fkTarget: 'news', fkLabelField: 'titre' },
    { name: 'urlPublique', label: 'URL publique', type: 'text', readOnly: true },
    { name: 'urlCourte', label: 'URL courte', type: 'text', readOnly: true, hiddenInList: true },
    { name: 'visibilite', label: 'Visibilité', type: 'select', required: true, options: [
      { value: 'public', label: 'Public' },
      { value: 'prive', label: 'Privé' },
      { value: 'limite', label: 'Limitée (scope)' },
    ] },
    { name: 'motDePasse', label: 'Mot de passe (à la création)', type: 'text', hiddenInList: true,
      helpText: 'Laisser vide pour un lien sans mot de passe. Non ré-affichable ensuite (haché côté serveur).' },
    { name: 'expiration', label: 'Expiration', type: 'datetime' },
    { name: 'usageUnique', label: 'Usage unique', type: 'boolean' },
    { name: 'clics', label: 'Clics', type: 'number', readOnly: true, hiddenInForm: true },
    { name: 'scans', label: 'Scans QR', type: 'number', readOnly: true, hiddenInForm: true },
    { name: 'createdAt', label: 'Créé le', type: 'datetime', readOnly: true, hiddenInForm: true },
  ],
  data: {
    list: () => liensRepository.list(),
    get: (id) => liensRepository.getById(id),
    create: (values) => liensRepository.generate(values.newsId as string, {
      visibilite: values.visibilite as LienPublication['visibilite'],
      motDePasse: (values.motDePasse as string) || undefined,
      expiration: (values.expiration as string) || undefined,
      usageUnique: values.usageUnique as boolean | undefined,
    }),
    remove: (id) => liensRepository.remove(id),
  },
};
