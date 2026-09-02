// ============================================================
// src/features/news/components/NewsFiltres.tsx
// Panneau de filtres News — une ligne de puces par champ à sélection
// du modèle News (Backend-Core-Base news/models.py) :
//   - Thèmes (categorie)      -> FK, options chargées via
//                                useReferentiels() (referentiels.service)
//   - Format (type)            -> choices fixes, voir
//                                constants/newsFieldOptions.ts
//   - Province                 -> choices fixes, idem
//   - Organisation              -> FK, via useReferentiels()
//   - Établissement            -> FK, via useReferentiels()
//
// `statut`/`visibilite` sont volontairement absents de ce panneau :
// voir le commentaire sur NewsQueryParams dans
// services/api/repositories/news.repository.ts (la liste publique ne
// renvoie déjà qu'une seule valeur possible pour ces deux champs).
//
// Chaque option non "Tous/Toutes" est affichée à pleine opacité
// seulement si elle concerne AU MOINS une News dans `allNews` (sinon
// la sélectionner ne changerait rien à l'affichage) — voir
// FilterPillRow ci-dessous.
// ============================================================

import React, { useMemo } from 'react';
import { Filter } from 'lucide-react';
import type { News, NewsType } from '../../../types/global.types';
import { NEWS_TYPE_OPTIONS, PROVINCES_GABON } from '../constants/newsFieldOptions';
import { useReferentiels } from '../hooks/useReferentiels';

export interface NewsFiltresProps {
  selectedCategorieId: string;
  onSelectCategorieId: (id: string) => void;
  selectedType: NewsType | 'all';
  onSelectType: (t: NewsType | 'all') => void;
  selectedProvince: string;
  onSelectProvince: (prov: string) => void;
  selectedOrganisationId: string;
  onSelectOrganisationId: (id: string) => void;
  selectedEtablissementId: string;
  onSelectEtablissementId: (id: string) => void;
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

const ALL_SENTINEL = 'all';

interface PillOption {
  id: string;
  label: string;
}

/**
 * Une ligne de puces filtrables réutilisable : libellé + options,
 * avec opacité réduite pour toute option inactive et sans résultat
 * dans `availableIds`. `variant="primary"` reprend le style plein
 * (fond) historique de la ligne Thèmes ; `variant="secondary"` le
 * style plus léger (texte seul) historique de la ligne Format.
 */
function FilterPillRow({
  label,
  icon,
  options,
  selectedId,
  onSelect,
  availableIds,
  variant = 'secondary',
}: {
  label: string;
  icon?: React.ReactNode;
  options: PillOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  availableIds: Set<string>;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
      <span className="text-[10px] sm:text-xs font-extrabold text-white/60 uppercase shrink-0 flex items-center gap-1 mr-0.5">
        {icon}
        {label} :
      </span>
      {options.map((opt) => {
        const isActive = selectedId === opt.id;
        const isAvailable = opt.id === ALL_SENTINEL || availableIds.has(opt.id);
        // Une option active reste toujours pleinement visible même si
        // elle n'a plus de résultat (ex: référentiel changé entre-temps) :
        // seule une option INACTIVE et sans résultat est atténuée.
        const dimmed = !isActive && !isAvailable;
        const dimClass = dimmed ? 'opacity-40' : 'opacity-100';

        if (variant === 'primary') {
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              title={dimmed ? 'Aucune news ne correspond actuellement à cette option' : undefined}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${dimClass} ${
                isActive
                  ? 'bg-white text-[#5B4DFF] shadow-sm'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          );
        }

        return (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            title={dimmed ? 'Aucune news ne correspond actuellement à cette option' : undefined}
            className={`px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap shrink-0 ${dimClass} ${
              isActive ? 'bg-white text-slate-900 font-bold' : 'text-white/60 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export const NewsFiltres: React.FC<NewsFiltresProps> = ({
  selectedCategorieId,
  onSelectCategorieId,
  selectedType,
  onSelectType,
  selectedProvince,
  onSelectProvince,
  selectedOrganisationId,
  onSelectOrganisationId,
  selectedEtablissementId,
  onSelectEtablissementId,
  allNews,
}) => {
  const { categories, organisations, etablissements, isLoading: isLoadingReferentiels } = useReferentiels();

  // Valeurs effectivement présentes dans `allNews`, par dimension --
  // détermine l'opacité de chaque option (voir FilterPillRow).
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

  const categorieOptions: PillOption[] = useMemo(
    () => [{ id: ALL_SENTINEL, label: 'Tous les Sujets' }, ...categories.map((c) => ({ id: c.id, label: c.nom }))],
    [categories]
  );
  const typeOptions: PillOption[] = useMemo(
    () => [{ id: ALL_SENTINEL, label: 'Tous les formats' }, ...NEWS_TYPE_OPTIONS.map((t) => ({ id: t.value, label: t.label }))],
    []
  );
  const provinceOptions: PillOption[] = useMemo(
    () => [{ id: ALL_SENTINEL, label: 'Toutes les provinces' }, ...PROVINCES_GABON.map((p) => ({ id: p, label: p }))],
    []
  );
  const organisationOptions: PillOption[] = useMemo(
    () => [{ id: ALL_SENTINEL, label: 'Toutes les organisations' }, ...organisations.map((o) => ({ id: o.id, label: o.nom }))],
    [organisations]
  );
  const etablissementOptions: PillOption[] = useMemo(
    () => [{ id: ALL_SENTINEL, label: 'Tous les établissements' }, ...etablissements.map((e) => ({ id: e.id, label: e.nom }))],
    [etablissements]
  );

  return (
    <div className="flex flex-col gap-2 py-1.5">
      <FilterPillRow
        label="Thèmes"
        icon={<Filter className="w-3 h-3 text-white/80" />}
        variant="primary"
        options={categorieOptions}
        selectedId={selectedCategorieId}
        onSelect={onSelectCategorieId}
        availableIds={availability.categorieIds}
      />

      <div className="border-t border-white/15 pt-1">
        <FilterPillRow
          label="Format"
          options={typeOptions}
          selectedId={selectedType}
          onSelect={(id) => onSelectType(id as NewsType | 'all')}
          availableIds={availability.types}
        />
      </div>

      <div className="border-t border-white/15 pt-1">
        <FilterPillRow
          label="Province"
          options={provinceOptions}
          selectedId={selectedProvince}
          onSelect={onSelectProvince}
          availableIds={availability.provinces}
        />
      </div>

      {!isLoadingReferentiels && organisations.length > 0 && (
        <div className="border-t border-white/15 pt-1">
          <FilterPillRow
            label="Organisation"
            options={organisationOptions}
            selectedId={selectedOrganisationId}
            onSelect={onSelectOrganisationId}
            availableIds={availability.organisationIds}
          />
        </div>
      )}

      {!isLoadingReferentiels && etablissements.length > 0 && (
        <div className="border-t border-white/15 pt-1">
          <FilterPillRow
            label="Établissement"
            options={etablissementOptions}
            selectedId={selectedEtablissementId}
            onSelect={onSelectEtablissementId}
            availableIds={availability.etablissementIds}
          />
        </div>
      )}
    </div>
  );
};

export const SujetFiltres = NewsFiltres;
