// ============================================================
// src/features/news/creation/components/MetaFieldsRow.tsx
// Deuxième bloc du mode standard : une seule rangée, défilement
// horizontal SANS scrollbar visible (.no-scrollbar, voir index.css),
// qui rassemble tous les champs de sélection (format, catégorie,
// organisation, établissement, province) ET tous les champs de
// saisie manuelle courte (lieu, tags, dates, sondage) -- comme demandé,
// aucun de ces petits champs n'a de section dédiée à lui seul.
// ============================================================

import React, { useState } from 'react';
import { Tags, Building2, GraduationCap, MapPin, MapPinned, CalendarRange, ListChecks, X } from 'lucide-react';
import { FieldChipPopover, FieldOptionRow } from './FieldChipPopover';
import { Input } from '../../../../components/ui/Input';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { NEWS_TYPE_OPTIONS, PROVINCES_GABON } from '../../constants/newsFieldOptions';
import { NEWS_TYPE_ICONS } from '../newsTypeIcons';
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
          <div className="max-h-72 overflow-y-auto space-y-0.5">
            {NEWS_TYPE_OPTIONS.map((opt) => {
              const OptIcon = NEWS_TYPE_ICONS[opt.value];
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { form.setType(opt.value); close(); }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium transition-colors ${
                    form.type === opt.value ? 'bg-[#5B4DFF]/10 text-[#4739E0] dark:text-[#B8AFFF]' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                >
                  <OptIcon className="w-4 h-4 shrink-0 opacity-70" />
                  {opt.label}
                </button>
              );
            })}
          </div>
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
          <div className="max-h-72 overflow-y-auto space-y-0.5">
            {form.categories.map((cat) => (
              <FieldOptionRow key={cat.id} active={form.categorieId === cat.id} swatch={cat.couleur} onClick={() => { form.setCategorieId(cat.id); close(); }}>
                {cat.nom}
              </FieldOptionRow>
            ))}
          </div>
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
          <div className="max-h-72 overflow-y-auto space-y-0.5">
            <FieldOptionRow active={!form.organisationId} onClick={() => { form.setOrganisationId(''); close(); }}>Aucune</FieldOptionRow>
            {form.organisations.map((org) => (
              <FieldOptionRow key={org.id} active={form.organisationId === org.id} onClick={() => { form.setOrganisationId(org.id); close(); }}>
                {org.nom}
              </FieldOptionRow>
            ))}
          </div>
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
          <div className="max-h-72 overflow-y-auto space-y-0.5">
            <FieldOptionRow active={!form.etablissementId} onClick={() => { form.setEtablissementId(''); close(); }}>Aucun</FieldOptionRow>
            {form.etablissements.map((etab) => (
              <FieldOptionRow key={etab.id} active={form.etablissementId === etab.id} onClick={() => { form.setEtablissementId(etab.id); close(); }}>
                {etab.nom}
              </FieldOptionRow>
            ))}
          </div>
        )}
      </FieldChipPopover>

      {/* Province */}
      <FieldChipPopover icon={MapPin} label="Province" valueLabel={form.province} filled disabled={disabled}>
        {(close) => (
          <div className="max-h-72 overflow-y-auto space-y-0.5">
            {PROVINCES_GABON.map((p) => (
              <FieldOptionRow key={p} active={form.province === p} onClick={() => { form.setProvince(p); close(); }}>{p}</FieldOptionRow>
            ))}
          </div>
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
