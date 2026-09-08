// ============================================================
// src/features/news/creation/components/MetaFieldsRow.tsx
// Deuxième bloc du mode standard : une seule rangée, défilement
// horizontal SANS scrollbar visible (.no-scrollbar, voir index.css),
// qui rassemble tous les champs de sélection (format, catégorie,
// organisation, établissement, province) ET tous les champs de
// saisie manuelle courte (lieu, tags, dates, sondage) -- comme demandé,
// aucun de ces petits champs n'a de section dédiée à lui seul.
//
// Les champs de SÉLECTION (liste fermée d'options) réutilisent
// SearchableOptionsList -- même réforme/design que le combobox
// recherchable du backoffice (voir SelectComboboxField) : recherche
// en tête de panneau, coche sur l'option choisie. Les champs de
// saisie libre (lieu, tags, dates, sondage) restent inchangés.
// ============================================================

import React, { useState } from 'react';
import { Tags, Building2, GraduationCap, MapPin, MapPinned, CalendarRange, ListChecks, X } from 'lucide-react';
import { FieldChipPopover } from './FieldChipPopover';
import { SearchableOptionsList } from '../../../../components/ui/SearchableOptionsList';
import { Input } from '../../../../components/ui/Input';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { NEWS_TYPE_OPTIONS, PROVINCES_GABON } from '../../constants/newsFieldOptions';
import { NEWS_TYPE_ICONS } from '../newsTypeIcons';
import type { NewsType } from '../../../../types/global.types';
import type { NewsCreationForm } from '../useNewsCreationForm';

export const MetaFieldsRow: React.FC<{ form: NewsCreationForm }> = ({ form }) => {
  const [tagDraft, setTagDraft] = useState('');
  const disabled = form.isReadOnly;

  const TypeIcon = NEWS_TYPE_ICONS[form.type];
  const selectedCategorie = form.categories.find((c) => c.id === form.categorieId);
  const selectedOrganisation = form.organisations.find((o) => o.id === form.organisationId);
  const selectedEtablissement = form.etablissements.find((e) => e.id === form.etablissementId);

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-0.5">
      {/* Format */}
      <FieldChipPopover icon={TypeIcon} label="Format" valueLabel={NEWS_TYPE_OPTIONS.find((o) => o.value === form.type)?.label} filled disabled={disabled}>
        {(close) => (
          <SearchableOptionsList
            options={NEWS_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label, icon: NEWS_TYPE_ICONS[opt.value] }))}
            value={form.type}
            onSelect={(v) => { form.setType(v as NewsType); close(); }}
          />
        )}
      </FieldChipPopover>

      {/* Catégorie */}
      <FieldChipPopover
        icon={Tags}
        label="Catégorie"
        valueLabel={selectedCategorie?.nom || 'Catégorie'}
        filled={Boolean(selectedCategorie)}
        required
        disabled={disabled || form.isLoadingReferentiels}
      >
        {(close) => (
          <SearchableOptionsList
            options={form.categories.map((cat) => ({ value: cat.id, label: cat.nom, swatch: cat.couleur }))}
            value={form.categorieId}
            onSelect={(v) => { form.setCategorieId(v); close(); }}
          />
        )}
      </FieldChipPopover>

      {/* Organisation */}
      <FieldChipPopover
        icon={Building2}
        label="Organisation"
        valueLabel={selectedOrganisation?.nom || 'Organisation'}
        filled={Boolean(selectedOrganisation)}
        disabled={disabled || form.isLoadingReferentiels}
      >
        {(close) => (
          <SearchableOptionsList
            options={form.organisations.map((org) => ({ value: org.id, label: org.nom }))}
            value={form.organisationId}
            nullableLabel="Aucune"
            onClear={() => { form.setOrganisationId(''); close(); }}
            onSelect={(v) => { form.setOrganisationId(v); close(); }}
          />
        )}
      </FieldChipPopover>

      {/* Établissement */}
      <FieldChipPopover
        icon={GraduationCap}
        label="Établissement"
        valueLabel={selectedEtablissement?.nom || 'Établissement'}
        filled={Boolean(selectedEtablissement)}
        disabled={disabled || form.isLoadingReferentiels}
      >
        {(close) => (
          <SearchableOptionsList
            options={form.etablissements.map((etab) => ({ value: etab.id, label: etab.nom }))}
            value={form.etablissementId}
            nullableLabel="Aucun"
            onClear={() => { form.setEtablissementId(''); close(); }}
            onSelect={(v) => { form.setEtablissementId(v); close(); }}
          />
        )}
      </FieldChipPopover>

      {/* Province */}
      <FieldChipPopover icon={MapPin} label="Province" valueLabel={form.province} filled disabled={disabled}>
        {(close) => (
          <SearchableOptionsList
            options={PROVINCES_GABON.map((p) => ({ value: p, label: p }))}
            value={form.province}
            onSelect={(v) => { form.setProvince(v); close(); }}
          />
        )}
      </FieldChipPopover>

      {/* Lieu (saisie libre) */}
      <FieldChipPopover icon={MapPinned} label="Lieu" valueLabel={form.lieu || 'Lieu précis'} filled={Boolean(form.lieu)} disabled={disabled}>
        {() => (
          <Input label="Lieu précis" value={form.lieu} onChange={(e) => form.setLieu(e.target.value)} placeholder="Ex: Bibliothèque centrale, Libreville" disabled={disabled} />
        )}
      </FieldChipPopover>

      {/* Tags (saisie libre multiple) */}
      <FieldChipPopover icon={Tags} label="Tags" valueLabel={form.tags.length ? `${form.tags.length} tag${form.tags.length > 1 ? 's' : ''}` : 'Tags'} filled={form.tags.length > 0} disabled={disabled}>
        {() => (
          <div className="space-y-2.5">
            <Input
              label="Ajouter un tag"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  form.addTag(tagDraft);
                  setTagDraft('');
                }
              }}
              placeholder="Ex: environnement — Entrée pour ajouter"
              disabled={disabled}
            />
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-[#5B4DFF]/10 text-[#4739E0] dark:text-[#B8AFFF] text-xs font-semibold pl-2.5 pr-1.5 py-1">
                    #{t}
                    {!disabled && (
                      <button type="button" onClick={() => form.removeTag(t)} className="hover:bg-[#5B4DFF]/20 rounded-full p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </FieldChipPopover>

      {/* Fenêtre temporelle (événements, conférences, réunions...) */}
      <FieldChipPopover
        icon={CalendarRange}
        label="Dates"
        valueLabel={form.dateDebut ? new Date(form.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : 'Dates'}
        filled={Boolean(form.dateDebut)}
        disabled={disabled}
      >
        {() => (
          <div className="space-y-3">
            <DatePicker label="Début" value={form.dateDebut} onChange={form.setDateDebut} />
            <DatePicker label="Fin" value={form.dateFin} onChange={form.setDateFin} min={form.dateDebut} />
          </div>
        )}
      </FieldChipPopover>

      {/* Sondage express -- capacité additionnelle, réservée aux organisations/modération (SONDAGE_CREATE). */}
      {form.canCreatePoll && (
        <FieldChipPopover icon={ListChecks} label="Sondage" valueLabel={form.addPoll ? 'Sondage activé' : 'Sondage'} filled={form.addPoll} disabled={disabled}>
          {() => (
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                <input
                  type="checkbox"
                  checked={form.addPoll}
                  onChange={(e) => form.setAddPoll(e.target.checked)}
                  disabled={form.hasExistingSondage || disabled}
                  className="w-4 h-4 accent-[#5B4DFF] disabled:opacity-60"
                />
                Ajouter une question de sondage
              </label>
              {form.hasExistingSondage && (
                <p className="text-xs text-amber-600 dark:text-amber-400">Un sondage est déjà associé ; ces champs sont indicatifs.</p>
              )}
              {form.addPoll && (
                <div className={`space-y-2.5 ${form.hasExistingSondage || disabled ? 'opacity-60 pointer-events-none' : ''}`}>
                  <Input label="Question" value={form.pollQuestion} onChange={(e) => form.setPollQuestion(e.target.value)} placeholder="Ex: Êtes-vous favorable à cette mesure ?" />
                  <div className="grid grid-cols-2 gap-2.5">
                    <Input label="Option 1" value={form.pollChoice1} onChange={(e) => form.setPollChoice1(e.target.value)} placeholder="Pour" />
                    <Input label="Option 2" value={form.pollChoice2} onChange={(e) => form.setPollChoice2(e.target.value)} placeholder="Contre" />
                  </div>
                  <DatePicker label="Ouverture du vote" value={form.pollDateDebut} onChange={form.setPollDateDebut} />
                  <DatePicker label="Clôture du vote" value={form.pollDateFin} onChange={form.setPollDateFin} min={form.pollDateDebut} />
                </div>
              )}
            </div>
          )}
        </FieldChipPopover>
      )}
    </div>
  );
};
