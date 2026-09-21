// ============================================================
// src/features/organisations/details/organisationFiche.schema.ts
// Description DÉCLARATIVE de la fiche d'une organisation : sections,
// champs, et permission requise pour VOIR / MODIFIER chaque section.
// Ajouter un champ ou changer qui peut l'éditer se fait ici, jamais
// dans un composant. Les clés correspondent à TenantInformationsPrimaires
// (backend : tenants.models.TenantInformationsPrimaires).
// ============================================================

import { Building2, MapPin, UserRound, Briefcase, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PERMISSIONS, type Permission } from '../../../lib/permissions/permissions.catalog';
import type { TenantInformationsPrimaires } from '../../../services/api/repositories/tenants.repository';
import type { FieldOption } from '../../../components/backoffice/registry/types';
import {
  FORME_JURIDIQUE_OPTIONS,
  SECTEUR_ACTIVITE_OPTIONS,
  PROVINCE_GABON_OPTIONS,
} from '../creation/informationsPrimaires.options';

export type FicheFieldKind =
  | 'text' | 'email' | 'tel' | 'url' | 'date' | 'datetime' | 'number' | 'percent' | 'textarea' | 'select' | 'socials';

export type FicheFieldKey = Exclude<keyof TenantInformationsPrimaires, 'id' | 'tenant'>;

export interface FicheField {
  key: FicheFieldKey;
  label: string;
  kind: FicheFieldKind;
  options?: FieldOption[];
  /** Occupe toute la largeur de la grille. */
  wide?: boolean;
}

export interface FicheSection {
  id: 'identite' | 'coordonnees' | 'responsables' | 'activites' | 'verification';
  title: string;
  description: string;
  icon: LucideIcon;
  viewPermission: Permission;
  /** Absente = section en lecture seule pour tous (ex : suivi de vérification). */
  editPermission?: Permission;
  fields: FicheField[];
}

export const STATUT_VERIFICATION_OPTIONS: FieldOption[] = [
  { value: 'a_completer', label: 'À compléter' },
  { value: 'en_attente_verification', label: 'En attente de vérification' },
  { value: 'verifiee', label: 'Vérifiée' },
  { value: 'a_corriger', label: 'À corriger' },
];

export const FICHE_SECTIONS: FicheSection[] = [
  {
    id: 'identite',
    title: 'Identité légale',
    description: 'Forme juridique, secteur et numéros d’immatriculation.',
    icon: Building2,
    viewPermission: PERMISSIONS.ORGANISATION_FICHE_VIEW,
    editPermission: PERMISSIONS.ORGANISATION_FICHE_EDIT_IDENTITE,
    fields: [
      { key: 'raisonSociale', label: 'Raison sociale', kind: 'text' },
      { key: 'sigle', label: 'Sigle', kind: 'text' },
      { key: 'formeJuridique', label: 'Forme juridique', kind: 'select', options: FORME_JURIDIQUE_OPTIONS },
      { key: 'secteurActivite', label: 'Secteur d’activité', kind: 'select', options: SECTEUR_ACTIVITE_OPTIONS },
      { key: 'numeroRccm', label: 'N° RCCM', kind: 'text' },
      { key: 'numeroNif', label: 'N° NIF', kind: 'text' },
      { key: 'numeroAgrement', label: 'N° d’agrément', kind: 'text' },
      { key: 'dateCreationOuAgrement', label: 'Date de création / d’agrément', kind: 'date' },
    ],
  },
  {
    id: 'coordonnees',
    title: 'Coordonnées',
    description: 'Adresse du siège, moyens de contact et réseaux sociaux.',
    icon: MapPin,
    viewPermission: PERMISSIONS.ORGANISATION_FICHE_VIEW,
    editPermission: PERMISSIONS.ORGANISATION_FICHE_EDIT_COORDONNEES,
    fields: [
      { key: 'adresseSiege', label: 'Adresse du siège', kind: 'text', wide: true },
      { key: 'ville', label: 'Ville', kind: 'text' },
      { key: 'province', label: 'Province', kind: 'select', options: PROVINCE_GABON_OPTIONS },
      { key: 'pays', label: 'Pays', kind: 'text' },
      { key: 'telephonePrincipal', label: 'Téléphone principal', kind: 'tel' },
      { key: 'telephoneSecondaire', label: 'Téléphone secondaire', kind: 'tel' },
      { key: 'emailContact', label: 'E-mail de contact', kind: 'email' },
      { key: 'siteWeb', label: 'Site web', kind: 'url' },
      { key: 'reseauxSociaux', label: 'Réseaux sociaux', kind: 'socials', wide: true },
    ],
  },
  {
    id: 'responsables',
    title: 'Responsables',
    description: 'Responsable légal et contact opérationnel.',
    icon: UserRound,
    viewPermission: PERMISSIONS.ORGANISATION_FICHE_VIEW,
    editPermission: PERMISSIONS.ORGANISATION_FICHE_EDIT_RESPONSABLES,
    fields: [
      { key: 'responsableNomComplet', label: 'Responsable légal', kind: 'text' },
      { key: 'responsableFonction', label: 'Fonction', kind: 'text' },
      { key: 'responsableTelephone', label: 'Téléphone', kind: 'tel' },
      { key: 'responsableEmail', label: 'E-mail', kind: 'email' },
      { key: 'contactOperationnelNom', label: 'Contact opérationnel', kind: 'text' },
      { key: 'contactOperationnelFonction', label: 'Fonction', kind: 'text' },
      { key: 'contactOperationnelTelephone', label: 'Téléphone', kind: 'tel' },
      { key: 'contactOperationnelEmail', label: 'E-mail', kind: 'email' },
    ],
  },
  {
    id: 'activites',
    title: 'Activités',
    description: 'Effectif, zone de couverture et description des activités.',
    icon: Briefcase,
    viewPermission: PERMISSIONS.ORGANISATION_FICHE_VIEW,
    editPermission: PERMISSIONS.ORGANISATION_FICHE_EDIT_ACTIVITES,
    fields: [
      { key: 'effectifEstime', label: 'Effectif estimé', kind: 'number' },
      { key: 'zoneCouverture', label: 'Zone de couverture', kind: 'text' },
      { key: 'descriptionActivites', label: 'Description des activités', kind: 'textarea', wide: true },
    ],
  },
  {
    id: 'verification',
    title: 'Suivi de vérification',
    description: 'État de la fiche. Ces informations ne sont pas modifiables ici.',
    icon: ShieldCheck,
    viewPermission: PERMISSIONS.ORGANISATION_VERIFICATION_VIEW,
    fields: [
      { key: 'statut', label: 'Statut', kind: 'select', options: STATUT_VERIFICATION_OPTIONS },
      { key: 'pourcentageCompletion', label: 'Complétion', kind: 'percent' },
      { key: 'verifieLe', label: 'Vérifiée le', kind: 'datetime' },
      { key: 'creeLe', label: 'Créée le', kind: 'datetime' },
      { key: 'modifieLe', label: 'Dernière modification', kind: 'datetime' },
      { key: 'commentaireVerification', label: 'Commentaire de vérification', kind: 'textarea', wide: true },
    ],
  },
];
