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
import { ROLE_OPTIONS } from '../../../../lib/constants/userRoles';
import UserOrbitCarousel from '../../users/UserOrbitCarousel';
import UserRecordDetail from '../../users/UserRecordDetail';
import { buildUserPatch } from '../../users/profile/userProfile.logic';

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
  // Carrousel visuel qui REMPLACE le tableau générique (voir
  // ModelDef.ListExtras + listExtrasMode) -- lots de 8 utilisateurs par
  // slide, slides ajoutées automatiquement selon le nombre total
  // d'utilisateurs. `searchFields` reste déclaré : il redeviendrait
  // actif tel quel si le tableau était réaffiché un jour
  // (listExtrasMode: 'above' ou suppression de l'option).
  ListExtras: UserOrbitCarousel,
  listExtrasMode: 'replace',
  // Fiche détail "profil" (bannière, statuts, grille d'informations,
  // badges) en lieu et place du Card + formulaire générique -- voir
  // ModelDef.RecordExtras. Le bouton « Modifier » de la fiche transforme
  // ces MÊMES cadres en champs, en place (voir users/profile/) : le
  // formulaire générique (BackofficeRecordForm) n'est plus utilisé pour
  // les utilisateurs. `fields` ci-dessous reste la description de
  // référence du modèle (registre, sélecteurs FK d'autres tables).
  RecordExtras: UserRecordDetail,
  recordViewMode: 'replace',
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
    // `values` peut ne contenir QUE les champs modifiés (PATCH partiel) :
    // voir buildUserPatch pour la règle « absent = non envoyé ».
    update: (id, values) => usersRepository.update(Number(id), buildUserPatch(values)),
  },
};
