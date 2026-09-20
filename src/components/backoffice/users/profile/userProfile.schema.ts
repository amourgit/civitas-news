// ============================================================
// src/components/backoffice/users/profile/userProfile.schema.ts
// Description DÉCLARATIVE de la fiche Utilisateur : quels champs sont
// modifiables, sous quelle permission, et dans quel ordre s'affichent
// les cadres de la grille. Aucun JSX ici, aucun hook : de la donnée pure,
// lue à la fois par l'affichage (ProfileTile, ProfileBanner), par le
// brouillon (useUserProfileDraft) et par les tests.
//
// Deux couches de contrôle d'accès, volontairement distinctes :
//   1. `canManage` (porte d'entrée, fournie par BackofficeRecordPage :
//      ADMIN_UTILISATEUR_GERER) -- sans lui, aucune édition du tout ;
//   2. `editPermission` PAR CHAMP (ci-dessous) -- décide QUOI on peut
//      modifier. Un champ dont la permission manque reste affiché, mais
//      verrouillé (jamais masqué : l'utilisateur doit comprendre
//      pourquoi il ne peut pas le changer).
//
// Ajouter un champ éditable = l'ajouter dans EDITABLE_FIELDS (+ dans le
// brouillon ci-dessous) puis dans PROFILE_TILES ou dans la bannière.
// ============================================================

import {
  Mail, Phone, MapPin, Cake, CalendarDays, Clock, Building2, Landmark, Globe, KeyRound,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { PERMISSIONS, type Permission } from '../../../../lib/permissions/permissions.catalog';
import { ROLE_OPTIONS, type RoleOption } from '../../../../lib/constants/userRoles';
import { formatDateFull, formatDateRelative } from '../../../../lib/formatDate';
import type { BackendUser } from '../../../../types/models/backend.types';

export type TileIcon = ComponentType<{ className?: string }>;

// ── Champs modifiables (= ce que UserUpdateSerializer accepte côté backend) ──

export type EditableField =
  | 'firstName' | 'lastName' | 'dateOfBirth'
  | 'email' | 'phoneNumber' | 'address'
  | 'role' | 'etablissement' | 'organisation'
  | 'isActive' | 'isVerified';

/** État de formulaire : une valeur « plate » par champ. Les FK sont des
 * ids en chaîne (`''` = aucun), les dates au format `YYYY-MM-DD`. */
export interface UserProfileDraft {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phoneNumber: string;
  address: string;
  role: string;
  etablissement: string;
  organisation: string;
  isActive: boolean;
  isVerified: boolean;
}

export type EditableFieldKind = 'text' | 'email' | 'tel' | 'date' | 'fk' | 'select' | 'boolean';

export interface EditableFieldDef {
  name: EditableField;
  label: string;
  kind: EditableFieldKind;
  /** Permission qui gouverne l'édition de CE champ. */
  editPermission: Permission;
  /** Verrouillé quand l'administrateur consulte SON PROPRE compte :
   * se retirer son rôle ou se désactiver reviendrait à s'enfermer dehors. */
  lockWhenSelf?: boolean;
  placeholder?: string;
  /** Pour `kind: 'fk'` : table cible du registre. */
  fkTarget?: 'etablissement' | 'organisation';
  /** Pour `kind: 'select'`. */
  options?: RoleOption[];
}

export const EDITABLE_FIELDS: Record<EditableField, EditableFieldDef> = {
  firstName: { name: 'firstName', label: 'Prénom', kind: 'text', placeholder: 'Prénom', editPermission: PERMISSIONS.ADMIN_UTILISATEUR_EDIT_IDENTITE },
  lastName: { name: 'lastName', label: 'Nom', kind: 'text', placeholder: 'Nom', editPermission: PERMISSIONS.ADMIN_UTILISATEUR_EDIT_IDENTITE },
  dateOfBirth: { name: 'dateOfBirth', label: 'Date de naissance', kind: 'date', editPermission: PERMISSIONS.ADMIN_UTILISATEUR_EDIT_IDENTITE },

  email: { name: 'email', label: 'Email', kind: 'email', placeholder: 'nom@exemple.com', editPermission: PERMISSIONS.ADMIN_UTILISATEUR_EDIT_CONTACT },
  phoneNumber: { name: 'phoneNumber', label: 'Téléphone', kind: 'tel', placeholder: '+241 06 12 34 56', editPermission: PERMISSIONS.ADMIN_UTILISATEUR_EDIT_CONTACT },
  address: { name: 'address', label: 'Adresse', kind: 'text', placeholder: 'Quartier, ville', editPermission: PERMISSIONS.ADMIN_UTILISATEUR_EDIT_CONTACT },

  role: { name: 'role', label: 'Rôle', kind: 'select', options: ROLE_OPTIONS, lockWhenSelf: true, editPermission: PERMISSIONS.ADMIN_UTILISATEUR_EDIT_ROLE },
  etablissement: { name: 'etablissement', label: 'Établissement', kind: 'fk', fkTarget: 'etablissement', editPermission: PERMISSIONS.ADMIN_UTILISATEUR_EDIT_RATTACHEMENT },
  organisation: { name: 'organisation', label: 'Organisation', kind: 'fk', fkTarget: 'organisation', editPermission: PERMISSIONS.ADMIN_UTILISATEUR_EDIT_RATTACHEMENT },

  isActive: { name: 'isActive', label: 'Compte actif', kind: 'boolean', lockWhenSelf: true, editPermission: PERMISSIONS.ADMIN_UTILISATEUR_EDIT_STATUT },
  isVerified: { name: 'isVerified', label: 'Compte vérifié', kind: 'boolean', editPermission: PERMISSIONS.ADMIN_UTILISATEUR_EDIT_STATUT },
};

export const EDITABLE_FIELD_NAMES = Object.keys(EDITABLE_FIELDS) as EditableField[];

// ── Cadres de la grille (ordre = ordre d'affichage) ──

interface TileBase {
  id: string;
  icon: TileIcon;
}

/** Cadre lié à un champ modifiable : affichage en lecture, champ en édition. */
export interface FieldTileDef extends TileBase {
  type: 'field';
  field: EditableField;
  /** Texte affiché en lecture quand la valeur est vide. */
  emptyLabel?: string;
  /** En lecture, masque le cadre s'il est vide (il réapparaît en édition,
   * pour pouvoir le renseigner). */
  hideWhenEmptyInView?: boolean;
}

/** Donnée gérée par le système (dates, langue) : jamais modifiable ici. */
export interface SystemTileDef extends TileBase {
  type: 'system';
  label: string;
  /** Valeur affichée ; `null` = cadre masqué. */
  read: (record: BackendUser) => string | null;
}

/** Secret : cadre TOUJOURS grisé, contenu remplacé par des étoiles. Le
 * mot de passe n'est jamais renvoyé par l'API (et n'est pas dans
 * UserUpdateSerializer) : il n'existe donc aucune valeur à afficher. */
export interface SecretTileDef extends TileBase {
  type: 'secret';
  label: string;
  reason: string;
}

export type ProfileTileDef = FieldTileDef | SystemTileDef | SecretTileDef;

export const PASSWORD_MASK = '••••••••';

export const PROFILE_TILES: ProfileTileDef[] = [
  { id: 'email', type: 'field', field: 'email', icon: Mail, emptyLabel: 'Non renseigné' },
  { id: 'phoneNumber', type: 'field', field: 'phoneNumber', icon: Phone, emptyLabel: 'Non renseigné' },
  {
    id: 'password', type: 'secret', label: 'Mot de passe', icon: KeyRound,
    reason: 'Le mot de passe ne peut pas être modifié depuis cette fiche.',
  },
  { id: 'address', type: 'field', field: 'address', icon: MapPin, emptyLabel: 'Non renseignée' },
  { id: 'dateOfBirth', type: 'field', field: 'dateOfBirth', icon: Cake, hideWhenEmptyInView: true },
  {
    id: 'dateJoined', type: 'system', label: 'Membre depuis', icon: CalendarDays,
    read: (r) => (r.dateJoined ? formatDateFull(r.dateJoined) : null),
  },
  {
    id: 'lastLogin', type: 'system', label: 'Dernière connexion', icon: Clock,
    read: (r) => (r.lastLogin ? formatDateRelative(r.lastLogin) : 'Jamais connecté'),
  },
  { id: 'etablissement', type: 'field', field: 'etablissement', icon: Building2, hideWhenEmptyInView: true },
  { id: 'organisation', type: 'field', field: 'organisation', icon: Landmark, hideWhenEmptyInView: true },
  {
    id: 'locale', type: 'system', label: 'Langue & fuseau horaire', icon: Globe,
    read: (r) => [r.languagePreference, r.timezone].filter(Boolean).join(' · ') || null,
  },
];
