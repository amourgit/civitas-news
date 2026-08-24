// ============================================================
// src/types/models/common.types.ts
// Éléments transverses, communs à plusieurs domaines — miroir du
// « Socle de Traçabilité » backend (Backend-Core-Base, common/models.py:
// SocleTracabilite), hérité par TOUTES les entités métier sans exception
// (Categorie, Organisation, Etablissement, News, Commentaire, Sondage,
// LienPublication, Signalement...).
//
// Volontairement PAS repris champ pour champ ici (cree_par/modifie_par/
// version/origine_donnee/motif_derniere_modification/supprime_le restent
// des détails d'implémentation backend, jamais exposés tels quels par
// les serializers) : seuls `statut`, `creeLe` et `modifieLe` traversent
// réellement l'API et sont utiles au backoffice (colonne « Statut »,
// tri par date, badge d'archivage...).
// ============================================================

import { z } from 'zod';

export const StatutCycleVieSchema = z.enum(['actif', 'suspendu', 'archive', 'cloture']);
export type StatutCycleVie = z.infer<typeof StatutCycleVieSchema>;

export const STATUT_CYCLE_VIE_LABELS: Record<StatutCycleVie, string> = {
  actif: 'Actif',
  suspendu: 'Suspendu',
  archive: 'Archivé',
  cloture: 'Clôturé',
};

/** Champs de traçabilité communs, à étendre (via `.extend()`) par tout
 * schéma Zod représentant une entité qui hérite de `SocleTracabilite`
 * côté backend et expose ces informations en lecture. */
export const SocleTracabiliteSchema = z.object({
  statut: StatutCycleVieSchema.optional(),
  creeLe: z.string().optional(),
  modifieLe: z.string().optional(),
});
