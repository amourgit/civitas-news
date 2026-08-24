// ============================================================
// src/components/backoffice/registry/index.ts
// Point d'entrée unique du registre : agrège toutes les tables du
// backoffice et les groupe par app (pour la navbar — voir
// BackofficeSidebar). Ajouter une nouvelle table au backoffice se fait
// UNIQUEMENT ici + un fichier registry/models/<table>.registry.ts, sans
// toucher aux composants génériques (navbar/tableau/formulaire).
// ============================================================

import type { ModelDef, ModelKey } from './types';
import { newsModel } from './models/news.registry';
import { commentaireModel } from './models/commentaire.registry';
import { sondageModel } from './models/sondage.registry';
import { lienModel } from './models/lien.registry';
import { notificationModel } from './models/notification.registry';
import { categorieModel, organisationModel, etablissementModel } from './models/referentiels.registry';
import { signalementModel } from './models/signalement.registry';
import { utilisateurModel } from './models/utilisateur.registry';
import { journalModel } from './models/journal.registry';

/** Ordre d'apparition volontairement explicite (pas un simple tri
 * alphabétique) : reflète le flux de travail éditorial réel — on publie
 * du contenu, on modère les interactions, on gère la diffusion, on
 * entretient les référentiels, en dernier lieu la modération/les
 * comptes/le système. */
export const BACKOFFICE_MODELS: ModelDef<any>[] = [
  newsModel,
  commentaireModel,
  sondageModel,
  lienModel,
  notificationModel,
  categorieModel,
  organisationModel,
  etablissementModel,
  signalementModel,
  utilisateurModel,
  journalModel,
];

export const BACKOFFICE_MODEL_MAP: Record<string, ModelDef<any>> = Object.fromEntries(
  BACKOFFICE_MODELS.map((model) => [model.key, model]),
);

export function getModel(key: string | undefined): ModelDef<any> | undefined {
  if (!key) return undefined;
  return BACKOFFICE_MODEL_MAP[key];
}

export interface BackofficeAppGroup {
  appLabel: string;
  models: ModelDef<any>[];
}

/** Groupe les tables par app dans l'ordre de première apparition dans
 * `BACKOFFICE_MODELS` (pas un tri alphabétique — préserve l'intention
 * éditoriale ci-dessus au niveau des groupes eux-mêmes). */
export function groupModelsByApp(models: ModelDef<any>[] = BACKOFFICE_MODELS): BackofficeAppGroup[] {
  const groups: BackofficeAppGroup[] = [];
  const index: Record<string, BackofficeAppGroup> = {};
  for (const model of models) {
    if (!index[model.appLabel]) {
      const group: BackofficeAppGroup = { appLabel: model.appLabel, models: [] };
      index[model.appLabel] = group;
      groups.push(group);
    }
    index[model.appLabel].models.push(model);
  }
  return groups;
}

export type { ModelDef, ModelKey, FieldDef, FieldType, FieldOption, ModelDataAccess } from './types';
