// ============================================================
// src/services/api/statistiques.service.ts
// Service Statistiques globales — bascule automatique mock/réel
// selon `env.useMockData`.
//
// Le backend réel (/statistiques/v1/globales/) ne renvoie que les 11
// champs "de base" (voir statistiques/api/v1/serializers.py, dont
// `tauxTransparence` : % de News publiées avec un LienPublication généré). Il n'y a
// pas de champ backend pour `evolutionMensuelle` ni pour une notion de
// "statuts de consultation" façon workflow gouvernemental — et il n'y a
// aucune donnée démographique (genre/tranche d'âge) sur le modèle User,
// donc pas de `parite` possible non plus (voir bilan d'alignement).
//
// Ce qui EST honnêtement dérivable de données réelles (les News elles-
// mêmes, déjà exposées et paginées correctement) est calculé ici,
// côté frontend, à partir de newsService.getNews() : l'évolution
// mensuelle du volume de publications, et la répartition réelle par
// statut de publication (brouillon/publie/archive/signale) — substituée
// à la notion fictive "adoptée par décret / en analyse / en attente".
// `parite` et le détail `commentaires` par province restent mock-only
// (aucune donnée backend pour les calculer honnêtement) : ils sont
// `.optional()` dans le schéma et les widgets dégradent proprement
// (tiret ou 0) en leur absence.
// ============================================================

import { env } from '../../config/env';
import type { StatistiquesGlobales } from '../../types/global.types';
import { MOCK_STATISTIQUES_GLOBALES } from './mocks/statistiques.mock';
import { statistiquesRepository } from './repositories/statistiques.repository';
import { newsService } from './news.service';

/** Conservé pour compatibilité ascendante (le type canonique vit désormais dans types/models/statistiques.types.ts). */
export type { StatistiquesGlobales };

const MOIS_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const STATUT_PRESENTATION: Record<string, { label: string; couleur: string }> = {
  publie: { label: 'Publiées', couleur: '#34D399' },
  brouillon: { label: 'En brouillon', couleur: '#F59E0B' },
  archive: { label: 'Archivées', couleur: '#94A3B8' },
  signale: { label: 'Signalées', couleur: '#EF4444' },
};

/** Calcule evolutionMensuelle + statutsConsultations à partir des News réelles. */
async function enrichirDepuisNewsReelles(base: StatistiquesGlobales): Promise<StatistiquesGlobales> {
  try {
    const newsList = await newsService.getNews();
    if (newsList.length === 0) return base;

    const compteurParMois = new Map<string, number>();
    newsList.forEach((n) => {
      const date = new Date(n.createdAt);
      const cle = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      compteurParMois.set(cle, (compteurParMois.get(cle) || 0) + 1);
    });
    const evolutionMensuelle = Array.from(compteurParMois.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([cle, participation]) => {
        const moisIndex = Number(cle.split('-')[1]) - 1;
        return { mois: MOIS_LABELS[moisIndex] ?? cle, participation };
      });

    const total = newsList.length;
    const compteurParStatut = new Map<string, number>();
    newsList.forEach((n) => compteurParStatut.set(n.statut, (compteurParStatut.get(n.statut) || 0) + 1));
    const statutsConsultations = Array.from(compteurParStatut.entries()).map(([statut, compteur]) => ({
      statut,
      label: STATUT_PRESENTATION[statut]?.label ?? statut,
      pourcentage: Math.round((compteur / total) * 1000) / 10,
      compteur,
      couleur: STATUT_PRESENTATION[statut]?.couleur ?? '#5B4DFF',
    }));

    return { ...base, evolutionMensuelle, statutsConsultations };
  } catch (error) {
    console.error('Échec de l’enrichissement des statistiques depuis les News réelles :', error);
    return base;
  }
}

export const statistiquesService = {
  getStatistiquesGlobales: async (): Promise<StatistiquesGlobales> => {
    if (env.useMockData) {
      return MOCK_STATISTIQUES_GLOBALES;
    }
    const base = await statistiquesRepository.getGlobales();
    return enrichirDepuisNewsReelles(base);
  },
};
