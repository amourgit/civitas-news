// ============================================================
// src/components/backoffice/registry/models/referentiels.registry.ts
// ============================================================

import { Tag, Building2, School } from 'lucide-react';
import type { ModelDef } from '../types';
import type { Categorie, Organisation, Etablissement } from '../../../../types/global.types';
import { referentielsRepository } from '../../../../services/api/repositories/referentiels.repository';
import { PERMISSIONS } from '../../../../lib/permissions/permissions.catalog';
import { STATUT_CYCLE_VIE_LABELS, type StatutCycleVie } from '../../../../types/models/common.types';

const STATUT_OPTIONS = (Object.keys(STATUT_CYCLE_VIE_LABELS) as StatutCycleVie[]).map((value) => ({
  value,
  label: STATUT_CYCLE_VIE_LABELS[value],
}));

export const categorieModel: ModelDef<Categorie> = {
  key: 'categorie',
  appLabel: 'Référentiels',
  labelSingular: 'Catégorie',
  labelPlural: 'Catégories',
  icon: Tag,
  description: 'Catégories utilisées pour classer les News (couleur + icône affichées dans toute la plateforme).',
  viewPermission: PERMISSIONS.REFERENTIEL_VIEW,
  managePermission: PERMISSIONS.REFERENTIEL_MANAGE,
  capabilities: { create: true, edit: true, delete: true },
  searchFields: ['nom'],
  fields: [
    { name: 'nom', label: 'Nom', type: 'text', required: true },
    { name: 'couleur', label: 'Couleur', type: 'color', helpText: 'Code hexadécimal, ex. #5B4DFF.' },
    { name: 'icone', label: 'Icône', type: 'text', helpText: 'Nom d’icône Lucide, ex. "newspaper".' },
    { name: 'description', label: 'Description', type: 'textarea', hiddenInList: true },
    { name: 'statut', label: 'Statut', type: 'select', options: STATUT_OPTIONS },
    { name: 'creeLe', label: 'Créé le', type: 'datetime', readOnly: true, hiddenInForm: true },
  ],
  data: {
    list: () => referentielsRepository.listCategories(),
    get: (id) => referentielsRepository.getCategorie(id),
    create: (values) => referentielsRepository.createCategorie({
      nom: values.nom as string,
      couleur: (values.couleur as string) || undefined,
      icone: (values.icone as string) || undefined,
      description: (values.description as string) || undefined,
      statut: values.statut as StatutCycleVie | undefined,
    }),
    update: (id, values) => referentielsRepository.updateCategorie(id, {
      nom: values.nom as string,
      couleur: (values.couleur as string) || undefined,
      icone: (values.icone as string) || undefined,
      description: (values.description as string) || undefined,
      statut: values.statut as StatutCycleVie | undefined,
    }),
    remove: (id) => referentielsRepository.removeCategorie(id),
  },
};

const TYPE_ORGANISATION_OPTIONS = [
  { value: 'association_etudiante', label: 'Association étudiante' },
  { value: 'administration', label: 'Administration' },
  { value: 'club', label: 'Club' },
  { value: 'departement', label: 'Département académique' },
  { value: 'autre', label: 'Autre' },
];

export const organisationModel: ModelDef<Organisation> = {
  key: 'organisation',
  appLabel: 'Référentiels',
  labelSingular: 'Organisation',
  labelPlural: 'Organisations',
  icon: Building2,
  description: 'Associations, administrations et clubs pouvant publier des News en leur nom.',
  viewPermission: PERMISSIONS.REFERENTIEL_VIEW,
  managePermission: PERMISSIONS.REFERENTIEL_MANAGE,
  capabilities: { create: true, edit: true, delete: true },
  searchFields: ['nom'],
  fields: [
    { name: 'nom', label: 'Nom', type: 'text', required: true },
    { name: 'type', label: 'Type', type: 'select', options: TYPE_ORGANISATION_OPTIONS },
    { name: 'logo', label: 'Logo', type: 'image', hiddenInList: true,
      helpText: 'Modifiable uniquement à la création.' },
    { name: 'description', label: 'Description', type: 'textarea', hiddenInList: true },
    { name: 'statut', label: 'Statut', type: 'select', options: STATUT_OPTIONS },
    { name: 'creeLe', label: 'Créée le', type: 'datetime', readOnly: true, hiddenInForm: true },
  ],
  data: {
    list: () => referentielsRepository.listOrganisations(),
    get: (id) => referentielsRepository.getOrganisation(id),
    create: (values) => referentielsRepository.createOrganisation({
      nom: values.nom as string,
      type: values.type as Organisation['type'] as never,
      description: (values.description as string) || undefined,
      statut: values.statut as StatutCycleVie | undefined,
      logo: values.logo instanceof File ? values.logo : undefined,
    }),
    update: (id, values) => referentielsRepository.updateOrganisation(id, {
      nom: values.nom as string,
      type: values.type as Organisation['type'] as never,
      description: (values.description as string) || undefined,
      statut: values.statut as StatutCycleVie | undefined,
    }),
    remove: (id) => referentielsRepository.removeOrganisation(id),
  },
};

export const etablissementModel: ModelDef<Etablissement> = {
  key: 'etablissement',
  appLabel: 'Référentiels',
  labelSingular: 'Établissement',
  labelPlural: 'Établissements',
  icon: School,
  description: 'Établissements scolaires/universitaires auxquels une News ou un utilisateur peuvent être rattachés.',
  viewPermission: PERMISSIONS.REFERENTIEL_VIEW,
  managePermission: PERMISSIONS.REFERENTIEL_MANAGE,
  capabilities: { create: true, edit: true, delete: true },
  searchFields: ['nom', 'province'],
  fields: [
    { name: 'nom', label: 'Nom', type: 'text', required: true },
    { name: 'province', label: 'Province', type: 'text', required: true },
    { name: 'statut', label: 'Statut', type: 'select', options: STATUT_OPTIONS },
    { name: 'creeLe', label: 'Créé le', type: 'datetime', readOnly: true, hiddenInForm: true },
  ],
  data: {
    list: () => referentielsRepository.listEtablissements(),
    get: (id) => referentielsRepository.getEtablissement(id),
    create: (values) => referentielsRepository.createEtablissement({
      nom: values.nom as string,
      province: values.province as string,
      statut: values.statut as StatutCycleVie | undefined,
    }),
    update: (id, values) => referentielsRepository.updateEtablissement(id, {
      nom: values.nom as string,
      province: values.province as string,
      statut: values.statut as StatutCycleVie | undefined,
    }),
    remove: (id) => referentielsRepository.removeEtablissement(id),
  },
};
