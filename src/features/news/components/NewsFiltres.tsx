// ============================================================
// src/features/news/components/NewsFiltres.tsx
// Panneau de filtres News — une ligne MULTI-SÉLECTION par champ
// filtrable du modèle News (Backend-Core-Base news/models.py) :
//   - Thèmes (categorie)      -> FK, options chargées via
//                                useReferentiels() (referentiels.service)
//   - Format (type)            -> choices fixes, voir
//                                constants/newsFieldOptions.ts
//   - Province                 -> choices fixes, idem
//   - Organisation              -> FK, via useReferentiels()
//   - Établissement            -> FK, via useReferentiels()
//
// Chaque champ prend désormais un TABLEAU d'ids sélectionnés (0..n)
// au lieu d'un id unique + sentinelle "all" : sélection vide = aucune
// restriction sur ce champ (voir features/news/utils/newsFilters.ts
// pour l'application réelle du filtre, forcément côté frontend --
// DjangoFilterBackend ne sait filtrer qu'une seule valeur par champ).
//
// `statut`/`visibilite` sont volontairement absents de ce panneau :
// voir le commentaire sur NewsQueryParams dans
// services/api/repositories/news.repository.ts (la liste publique ne
// renvoie déjà qu'une seule valeur possible pour ces deux champs).
//
// Chaque option est affichée à pleine opacité dans le pool
// "disponible" seulement si elle concerne AU MOINS une News dans
// `allNews` (sinon la sélectionner ne changerait rien à l'affichage)
// -- voir `isAvailable` sur MultiSelectOption. Le widget de sélection
// (bandeau "sélectionnés" + pool "disponible", animations de layout
// partagé) est le composant générique `MultiSelectChips`
// (src/components/ui/MultiSelectChips.tsx) : ce fichier ne fait que
// lui fournir les options/état par champ.
//
// Couleurs : ce composant est rendu tantôt à même le fond de page
// (HomePage, aucun conteneur) tantôt dans un popup translucide
// (NewsListPage) -- dans les deux cas, le fond bascule entre clair
// (#F7F8FC) et sombre (#0E1338) selon le thème (voir App.tsx). Toute
// classe de couleur doit donc avoir sa paire `dark:` explicite ; ne
// JAMAIS utiliser `text-white`/`bg-white` seuls (illisible en thème
// clair -- texte blanc sur fond quasi blanc).
// ============================================================

import React, { useMemo } from 'react';
import { Filter } from 'lucide-react';
import type { News, NewsType } from '../../../types/global.types';
import { NEWS_TYPE_OPTIONS, PROVINCES_GABON } from '../constants/newsFieldOptions';
import { useReferentiels } from '../hooks/useReferentiels';
import { MultiSelectChips, type MultiSelectOption } from '../../../components/ui/MultiSelectChips';

export interface NewsFiltresProps {
  selectedCategorieIds: string[];
  onChangeCategorieIds: (ids: string[]) => void;
  selectedTypes: NewsType[];
  onChangeTypes: (types: NewsType[]) => void;
  selectedProvinces: string[];
  onChangeProvinces: (provinces: string[]) => void;
  selectedOrganisationIds: string[];
  onChangeOrganisationIds: (ids: string[]) => void;
  selectedEtablissementIds: string[];
  onChangeEtablissementIds: (ids: string[]) => void;
  /**
   * Jeu de News de référence pour calculer, par option, si elle
   * concerne au moins une News existante. À passer NON filtré (voir
   * HomePage/NewsListPage : `allNews`, déjà chargé sans paramètre pour
   * le BottomSheet) plutôt que la liste déjà réduite par les filtres
   * actifs — sinon le filtre actuellement actif éteindrait toutes les
   * AUTRES valeurs de son propre champ, puisque la liste chargée est
   * déjà restreinte à la valeur choisie.
   */
  allNews: News[];
}

/**
 * Une ligne de champ filtrable réutilisable : libellé + widget de
 * sélection multiple. `variant="primary"` reprend le traitement fort
 * (accent violet de marque) de la ligne Thèmes ; `variant="secondary"`
 * le traitement plus neutre des autres lignes -- appliqué ici au
 * libellé du champ (le design des puces lui-même vient de
 * MultiSelectChips et ne change pas d'une ligne à l'autre).
 */
function FilterFieldRow({
  label,
  icon,
  options,
  selectedIds,
  onChange,
  variant = 'secondary',
}: {
  label: string;
  icon?: React.ReactNode;
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className={`text-[10px] sm:text-xs font-extrabold uppercase shrink-0 flex items-center gap-1 ${
          variant === 'primary' ? 'text-[#5B4DFF]' : 'text-gray-500 dark:text-white/60'
        }`}
      >
        {icon}
        {label}
      </span>
      <MultiSelectChips options={options} selectedIds={selectedIds} onChange={onChange} />
    </div>
  );
}

export const NewsFiltres: React.FC<NewsFiltresProps> = ({
  selectedCategorieIds,
  onChangeCategorieIds,
  selectedTypes,
  onChangeTypes,
  selectedProvinces,
  onChangeProvinces,
  selectedOrganisationIds,
  onChangeOrganisationIds,
  selectedEtablissementIds,
  onChangeEtablissementIds,
  allNews,
}) => {
  const { categories, organisations, etablissements, isLoading: isLoadingReferentiels } = useReferentiels();

  // Valeurs effectivement présentes dans `allNews`, par dimension --
  // détermine l'opacité de chaque option dans le pool "disponible"
  // (voir MultiSelectOption.isAvailable).
  const availability = useMemo(() => {
    const types = new Set<string>();
    const categorieIds = new Set<string>();
    const organisationIds = new Set<string>();
    const etablissementIds = new Set<string>();
    const provinces = new Set<string>();
    for (const news of allNews) {
      types.add(news.type);
      categorieIds.add(news.categorie.id);
      if (news.organisation) organisationIds.add(news.organisation.id);
      if (news.etablissement) etablissementIds.add(news.etablissement.id);
      if (news.province) provinces.add(news.province);
    }
    return { types, categorieIds, organisationIds, etablissementIds, provinces };
  }, [allNews]);

  const categorieOptions: MultiSelectOption[] = useMemo(
    () => categories.map((c) => ({ id: c.id, label: c.nom, isAvailable: availability.categorieIds.has(c.id) })),
    [categories, availability.categorieIds],
  );
  const typeOptions: MultiSelectOption[] = useMemo(
    () => NEWS_TYPE_OPTIONS.map((t) => ({ id: t.value, label: t.label, isAvailable: availability.types.has(t.value) })),
    [availability.types],
  );
  const provinceOptions: MultiSelectOption[] = useMemo(
    () => PROVINCES_GABON.map((p) => ({ id: p, label: p, isAvailable: availability.provinces.has(p) })),
    [availability.provinces],
  );
  const organisationOptions: MultiSelectOption[] = useMemo(
    () => organisations.map((o) => ({ id: o.id, label: o.nom, isAvailable: availability.organisationIds.has(o.id) })),
    [organisations, availability.organisationIds],
  );
  const etablissementOptions: MultiSelectOption[] = useMemo(
    () => etablissements.map((e) => ({ id: e.id, label: e.nom, isAvailable: availability.etablissementIds.has(e.id) })),
    [etablissements, availability.etablissementIds],
  );

  return (
    <div className="flex flex-col gap-1.5 sm:gap-2 md:gap-2.5 py-1 sm:py-1.5">
      <FilterFieldRow
        label="Thèmes"
        icon={<Filter className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
        variant="primary"
        options={categorieOptions}
        selectedIds={selectedCategorieIds}
        onChange={onChangeCategorieIds}
      />

      <div className="border-t border-gray-200 dark:border-white/15 pt-1 sm:pt-1.5">
        <FilterFieldRow label="Format" options={typeOptions} selectedIds={selectedTypes} onChange={(ids) => onChangeTypes(ids as NewsType[])} />
      </div>

      <div className="border-t border-gray-200 dark:border-white/15 pt-1 sm:pt-1.5">
        <FilterFieldRow label="Province" options={provinceOptions} selectedIds={selectedProvinces} onChange={onChangeProvinces} />
      </div>

      {!isLoadingReferentiels && organisations.length > 0 && (
        <div className="border-t border-gray-200 dark:border-white/15 pt-1 sm:pt-1.5">
          <FilterFieldRow
            label="Organisation"
            options={organisationOptions}
            selectedIds={selectedOrganisationIds}
            onChange={onChangeOrganisationIds}
          />
        </div>
      )}

      {!isLoadingReferentiels && etablissements.length > 0 && (
        <div className="border-t border-gray-200 dark:border-white/15 pt-1 sm:pt-1.5">
          <FilterFieldRow
            label="Établissement"
            options={etablissementOptions}
            selectedIds={selectedEtablissementIds}
            onChange={onChangeEtablissementIds}
          />
        </div>
      )}
    </div>
  );
};
