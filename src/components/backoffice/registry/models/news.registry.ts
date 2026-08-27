// ============================================================
// src/components/backoffice/registry/models/news.registry.ts
// ============================================================

import { Newspaper } from 'lucide-react';
import type { ModelDef } from '../types';
import type { News, NewsType } from '../../../../types/global.types';
import { newsRepository, type NewsEcriturePayload } from '../../../../services/api/repositories/news.repository';
import { PERMISSIONS } from '../../../../lib/permissions/permissions.catalog';
import { NewsDetailExtras } from '../../news/NewsDetailExtras';

const NEWS_TYPE_OPTIONS: { value: NewsType; label: string }[] = [
  { value: 'article', label: 'Article' },
  { value: 'actualite', label: 'Actualité' },
  { value: 'annonce', label: 'Annonce' },
  { value: 'evenement', label: 'Événement' },
  { value: 'conference', label: 'Conférence' },
  { value: 'reunion', label: 'Réunion' },
  { value: 'atelier', label: 'Atelier' },
  { value: 'appel_participation', label: 'Appel à participation' },
  { value: 'projet', label: 'Projet' },
  { value: 'sondage', label: 'Sondage' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'petition', label: 'Pétition' },
  { value: 'information', label: 'Information' },
  { value: 'reforme', label: 'Réforme' },
  { value: 'idee', label: 'Idée' },
  { value: 'publication', label: 'Publication' },
];

/** Extrait un fichier local éventuellement déposé dans le champ `image`
 * du formulaire (l'utilisateur a choisi un nouveau fichier) — sinon
 * `undefined` (valeur inchangée, simple URL de prévisualisation). */
function extractImageFile(value: unknown): File | undefined {
  return value instanceof File ? value : undefined;
}

export const newsModel: ModelDef<News> = {
  key: 'news',
  appLabel: 'Contenu',
  labelSingular: 'News',
  labelPlural: 'News',
  icon: Newspaper,
  description: 'Articles, événements, annonces et autres contenus publiés sur la plateforme.',
  viewPermission: PERMISSIONS.NEWS_VIEW,
  managePermission: PERMISSIONS.BACKOFFICE_NEWS_MANAGE,
  capabilities: { create: true, edit: true, delete: true },
  searchFields: ['titre', 'description', 'slug'],
  DetailExtras: NewsDetailExtras,
  fields: [
    { name: 'titre', label: 'Titre', type: 'text', required: true },
    { name: 'slug', label: 'Slug', type: 'text', helpText: 'Généré automatiquement si laissé vide.' },
    { name: 'type', label: 'Type', type: 'select', required: true, options: NEWS_TYPE_OPTIONS },
    { name: 'statut', label: 'Statut', type: 'select', required: true, options: [
      { value: 'brouillon', label: 'Brouillon' },
      { value: 'publie', label: 'Publié' },
      { value: 'archive', label: 'Archivé' },
      { value: 'signale', label: 'Signalé' },
    ] },
    { name: 'visibilite', label: 'Visibilité', type: 'select', required: true, options: [
      { value: 'public', label: 'Public' },
      { value: 'prive', label: 'Privé' },
      { value: 'limite', label: 'Limitée (scope)' },
    ] },
    { name: 'categorie', label: 'Catégorie', type: 'fk', required: true, fkTarget: 'categorie', fkLabelField: 'nom' },
    { name: 'organisation', label: 'Organisation', type: 'fk', fkTarget: 'organisation', fkLabelField: 'nom' },
    { name: 'etablissement', label: 'Établissement', type: 'fk', fkTarget: 'etablissement', fkLabelField: 'nom' },
    { name: 'description', label: 'Description courte', type: 'textarea', required: true, hiddenInList: true },
    { name: 'contenu', label: 'Contenu', type: 'richtext', hiddenInList: true },
    { name: 'image', label: 'Image de couverture', type: 'image', hiddenInList: true,
      helpText: "Modifiable uniquement à la création — l'API ne permet pas encore de remplacer l'image d'une News existante." },
    { name: 'tags', label: 'Tags', type: 'tags', hiddenInList: true },
    { name: 'province', label: 'Province', type: 'text', hiddenInList: true },
    { name: 'lieu', label: 'Lieu', type: 'text', hiddenInList: true },
    { name: 'dateDebut', label: 'Date de début', type: 'datetime', hiddenInList: true },
    { name: 'dateFin', label: 'Date de fin', type: 'datetime', hiddenInList: true },
    { name: 'auteur', label: 'Auteur', type: 'badge', readOnly: true,
      renderList: (_v, record) => record.auteur?.nomAffiche ?? record.auteur?.username ?? '—' },
    { name: 'stats', label: 'Vues', type: 'json-readonly', readOnly: true, hiddenInForm: true,
      renderList: (_v, record) => record.stats?.vues ?? 0 },
    { name: 'createdAt', label: 'Créé le', type: 'datetime', readOnly: true, hiddenInForm: true },
  ],
  data: {
    list: () => newsRepository.list(),
    get: async (id) => {
      const record = await newsRepository.getBySlug(id);
      if (!record) throw new Error('News introuvable.');
      return record;
    },
    create: async (values) => {
      const payload: NewsEcriturePayload = {
        titre: values.titre as string,
        slug: (values.slug as string) || undefined,
        type: values.type as NewsType,
        description: values.description as string,
        contenu: (values.contenu as string) || undefined,
        image: extractImageFile(values.image),
        categorieId: values.categorie as string,
        organisationId: (values.organisation as string) || undefined,
        etablissementId: (values.etablissement as string) || undefined,
        tags: (values.tags as string[]) || undefined,
        province: (values.province as string) || undefined,
        lieu: (values.lieu as string) || undefined,
        dateDebut: (values.dateDebut as string) || undefined,
        dateFin: (values.dateFin as string) || undefined,
        statut: values.statut as NewsEcriturePayload['statut'],
        visibilite: values.visibilite as NewsEcriturePayload['visibilite'],
      };
      return newsRepository.create(payload);
    },
    update: (id, values) => newsRepository.update(id, {
      titre: values.titre as string,
      slug: (values.slug as string) || undefined,
      type: values.type as NewsType,
      description: values.description as string,
      contenu: (values.contenu as string) || undefined,
      image: extractImageFile(values.image),
      categorieId: (values.categorie as string) || undefined,
      organisationId: (values.organisation as string) || undefined,
      etablissementId: (values.etablissement as string) || undefined,
      tags: (values.tags as string[]) || undefined,
      province: (values.province as string) || undefined,
      lieu: (values.lieu as string) || undefined,
      dateDebut: (values.dateDebut as string) || undefined,
      dateFin: (values.dateFin as string) || undefined,
      statut: values.statut as NewsEcriturePayload['statut'],
      visibilite: values.visibilite as NewsEcriturePayload['visibilite'],
    }),
    remove: (id) => newsRepository.remove(id),
  },
};
