// ============================================================
// src/components/backoffice/registry/models/utilisateur.registry.ts
// Gestion de comptes — endpoint /users/v1/users/, réservé aux
// modérateurs/administrateurs côté backend (voir
// users/api/v1/views.py:UserViewSet, EstModerateurOuAdministrateur).
// TId = string ici par convention (routes /admin/:modelKey/:id), alors
// que le backend utilise des ids numériques : conversion aux deux
// bornes (list/get renvoient un id numérique casté en chaîne pour
// l'affichage, create/update reconvertissent en nombre).
// ============================================================

import { Users } from 'lucide-react';
import type { ModelDef } from '../types';
import type { BackendUser } from '../../../../types/models/backend.types';
import { usersRepository } from '../../../../services/api/repositories/users.repository';
import { PERMISSIONS } from '../../../../lib/permissions/permissions.catalog';

const ROLE_OPTIONS = [
  { value: 'etudiant', label: 'Étudiant' },
  { value: 'organisation', label: 'Organisation' },
  { value: 'moderateur', label: 'Modérateur' },
  { value: 'administrateur', label: 'Administrateur' },
];

function toNullableInt(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

export const utilisateurModel: ModelDef<BackendUser> = {
  key: 'utilisateur',
  appLabel: 'Utilisateurs',
  labelSingular: 'Utilisateur',
  labelPlural: 'Utilisateurs',
  icon: Users,
  description: 'Comptes de la plateforme — rôle applicatif, rattachements établissement/organisation, statut.',
  viewPermission: PERMISSIONS.ADMIN_UTILISATEUR_GERER,
  managePermission: PERMISSIONS.ADMIN_UTILISATEUR_GERER,
  // Création réservée aux superusers côté backend (UserViewSet.create
  // -> IsSuperUser) : le backoffice modérateur/admin standard ne
  // propose donc pas ce bouton, même si l'action existe techniquement.
  capabilities: { create: false, edit: true, delete: false },
  searchFields: ['username', 'email', 'firstName', 'lastName'],
  fields: [
    { name: 'username', label: "Nom d'utilisateur", type: 'text', readOnly: true },
    { name: 'firstName', label: 'Prénom', type: 'text' },
    { name: 'lastName', label: 'Nom', type: 'text' },
    { name: 'email', label: 'Email', type: 'text' },
    { name: 'role', label: 'Rôle', type: 'select', options: ROLE_OPTIONS },
    { name: 'etablissement', label: 'Établissement', type: 'fk', fkTarget: 'etablissement', fkLabelField: 'nom' },
    { name: 'organisation', label: 'Organisation', type: 'fk', fkTarget: 'organisation', fkLabelField: 'nom' },
    { name: 'isActive', label: 'Actif', type: 'boolean' },
    { name: 'isVerified', label: 'Vérifié', type: 'boolean' },
    { name: 'phoneNumber', label: 'Téléphone', type: 'text', hiddenInList: true },
    { name: 'address', label: 'Adresse', type: 'text', hiddenInList: true },
    { name: 'dateOfBirth', label: 'Date de naissance', type: 'date', hiddenInList: true },
    { name: 'badges', label: 'Badges', type: 'json-readonly', readOnly: true, hiddenInForm: true,
      renderList: (_v, record) => record.badges?.length ?? 0 },
    { name: 'dateJoined', label: 'Inscrit le', type: 'datetime', readOnly: true, hiddenInForm: true },
  ],
  data: {
    list: async () => {
      const users = await usersRepository.list();
      return users.map((u) => ({ ...u, id: u.id }));
    },
    get: async (id) => usersRepository.getById(Number(id)),
    update: (id, values) => usersRepository.update(Number(id), {
      firstName: values.firstName as string,
      lastName: values.lastName as string,
      email: (values.email as string) || undefined,
      role: values.role as BackendUser['role'],
      etablissement: toNullableInt(values.etablissement),
      organisation: toNullableInt(values.organisation),
      isActive: values.isActive as boolean,
      isVerified: values.isVerified as boolean,
      phoneNumber: (values.phoneNumber as string) || undefined,
      address: (values.address as string) || undefined,
      dateOfBirth: (values.dateOfBirth as string) || null,
    }),
  },
};
