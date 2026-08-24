// ============================================================
// src/components/backoffice/registry/types.ts
// Le registre de modèles est la pièce centrale du backoffice : chaque
// "table" (modèle Django) déclare ici ses champs, ses capacités
// (créer/éditer/supprimer) et les fonctions d'accès aux données à
// utiliser. La navbar, le tableau de liste et le formulaire de détail
// sont TOUS générés à partir de cette description — aucune page
// dédiée par modèle n'est écrite à la main (voir
// BackofficeSidebar/BackofficeDataTable/BackofficeRecordForm).
// ============================================================

import type { ComponentType } from 'react';
import type { Permission } from '../../../lib/permissions/permissions.catalog';

/** Identifiant stable de chaque table gérée par le backoffice —
 * utilisé dans l'URL (`/admin/:modelKey`) et comme clé du registre. */
export type ModelKey =
  | 'news' | 'newsMedia' | 'newsGalerie' | 'newsDocument'
  | 'commentaire' | 'sondage' | 'lien' | 'notification'
  | 'categorie' | 'organisation' | 'etablissement'
  | 'signalement' | 'utilisateur' | 'journal';

export type FieldType =
  | 'text' | 'textarea' | 'richtext'
  | 'number' | 'boolean'
  | 'date' | 'datetime'
  | 'select' | 'fk' | 'tags'
  | 'image' | 'file'
  | 'color' | 'badge' | 'json-readonly';

export interface FieldOption {
  value: string;
  label: string;
}

/** `TRecord` : forme de LECTURE d'un enregistrement (ex: `News`, `Commentaire`...). */
export interface FieldDef<TRecord = Record<string, unknown>> {
  /** Nom du champ dans l'objet de LECTURE (camelCase). */
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  helpText?: string;
  /** Affiché mais jamais envoyé en écriture (champs calculés : stats, dates système...). */
  readOnly?: boolean;
  /** N'apparaît pas dans la colonne du tableau liste. */
  hiddenInList?: boolean;
  /** N'apparaît pas dans le formulaire de détail/édition. */
  hiddenInForm?: boolean;
  /** Choix statiques pour `type: 'select'`. */
  options?: FieldOption[];
  /** Table cible pour `type: 'fk'` — résolue dynamiquement via le registre. */
  fkTarget?: ModelKey;
  /** Nom du champ à afficher pour chaque option du menu déroulant FK (défaut : `nom`, sinon `titre`). */
  fkLabelField?: string;
  /** Rendu personnalisé de la valeur dans la colonne liste (ex: badge coloré, miniature...). */
  renderList?: (value: unknown, record: TRecord) => React.ReactNode;
  /** Placeholder du champ de saisie. */
  placeholder?: string;
}

export interface ModelCapabilities {
  create: boolean;
  edit: boolean;
  delete: boolean;
}

/** Fonctions d'accès aux données — toujours redirigées vers les
 * repositories réels de src/services/api/repositories/ (jamais d'appel
 * HTTP direct depuis un composant backoffice). */
export interface ModelDataAccess<TRecord = Record<string, unknown>, TId = string> {
  list: () => Promise<TRecord[]>;
  get?: (id: TId) => Promise<TRecord>;
  create?: (payload: Record<string, unknown>) => Promise<TRecord>;
  update?: (id: TId, payload: Record<string, unknown>) => Promise<TRecord>;
  remove?: (id: TId) => Promise<void>;
}

export interface ModelDef<TRecord = Record<string, unknown>> {
  key: ModelKey;
  /** Groupe de la navbar (ex: "Contenu", "Référentiels"...). */
  appLabel: string;
  labelSingular: string;
  labelPlural: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  description?: string;
  fields: FieldDef<TRecord>[];
  capabilities: ModelCapabilities;
  /** Permission requise pour VOIR la table dans la navbar (défaut : BACKOFFICE_ACCESS). */
  viewPermission?: Permission;
  /** Permission requise pour créer/éditer/supprimer (défaut : identique à viewPermission). */
  managePermission?: Permission;
  data: ModelDataAccess<TRecord>;
  /** Champs sur lesquels porte la recherche texte libre du tableau liste. */
  searchFields?: (keyof TRecord & string)[];
  /** Composant optionnel affichant des onglets supplémentaires sur la page de détail
   * (ex: médias/galerie/documents/tags pour News). Reçoit l'enregistrement courant. */
  DetailExtras?: ComponentType<{ record: TRecord }>;
}
