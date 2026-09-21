// ============================================================
// Carte d'une section de la fiche : lecture par défaut ; bouton
// « Modifier » et formulaire UNIQUEMENT si `canEdit` (permission
// d'édition de CETTE section, portée courante — décidé par le
// parent, jamais ici). Enregistre un PATCH minimal.
// ============================================================
import React, { useState } from 'react';
import { Pencil, Plus, Trash2, Check, X } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { toast } from '../../../../hooks/useToast';
import type {
  TenantInformationsPrimaires,
  TenantInformationsPrimairesEcriturePayload,
} from '../../../../services/api/repositories/tenants.repository';
import { RESEAU_SOCIAL_OPTIONS, libelleOption } from '../../creation/informationsPrimaires.options';
import type { FicheField, FicheFieldKey, FicheSection } from '../organisationFiche.schema';
import {
  buildSectionPatch,
  draftFromFiche,
  validateSectionDraft,
  type SectionDraft,
} from '../ficheValues';

interface Props {
  section: FicheSection;
  fiche: TenantInformationsPrimaires;
  canEdit: boolean;
  onSave: (patch: TenantInformationsPrimairesEcriturePayload) => Promise<unknown>;
}

const EMPTY = <span className="text-gray-400 dark:text-gray-500">Non renseigné</span>;

function renderValue(field: FicheField, fiche: TenantInformationsPrimaires): React.ReactNode {
  if (field.kind === 'socials') {
    const entries = Object.entries(fiche.reseauxSociaux ?? {});
    if (!entries.length) return EMPTY;
    return (
      <ul className="flex flex-wrap gap-2">
        {entries.map(([plateforme, url]) => (
          <li key={plateforme}>
            <a href={url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-[#5B4DFF] hover:bg-[#5B4DFF]/10 dark:border-white/10">
              {libelleOption(RESEAU_SOCIAL_OPTIONS, plateforme) ?? plateforme}
            </a>
          </li>
        ))}
      </ul>
    );
  }
  const raw = fiche[field.key];
  if (raw === null || raw === undefined || raw === '') return EMPTY;
  if (field.kind === 'percent') {
    const pct = Number(raw);
    return (
      <div className="flex items-center gap-3">
        <div className="h-2 w-40 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
          <div className="h-full rounded-full bg-[#5B4DFF]" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <span className="tabular-nums">{pct} %</span>
      </div>
    );
  }
  const text = String(raw);
  if (field.kind === 'select') return libelleOption(field.options ?? [], text) ?? text;
  if (field.kind === 'date') return new Date(text).toLocaleDateString('fr-FR');
  if (field.kind === 'datetime') return new Date(text).toLocaleString('fr-FR');
  if (field.kind === 'email') return <a className="text-[#5B4DFF] hover:underline" href={`mailto:${text}`}>{text}</a>;
  if (field.kind === 'tel') return <a className="text-[#5B4DFF] hover:underline" href={`tel:${text}`}>{text}</a>;
  if (field.kind === 'url')
    return <a className="break-all text-[#5B4DFF] hover:underline" href={text} target="_blank" rel="noopener noreferrer">{text}</a>;
  return <span className="whitespace-pre-line">{text}</span>;
}

const selectClass =
  'h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-900 focus:border-[#5B4DFF] focus:outline-none dark:border-white/20 dark:text-white';

export const FicheSectionCard: React.FC<Props> = ({ section, fiche, canEdit, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SectionDraft>({ values: {}, socials: [] });
  const [errors, setErrors] = useState<Partial<Record<FicheFieldKey, string>>>({});
  const [saving, setSaving] = useState(false);
  const Icon = section.icon;

  const startEdit = () => {
    if (!canEdit) return;
    setDraft(draftFromFiche(section, fiche));
    setErrors({});
    setEditing(true);
  };

  const setValue = (key: string, value: string) => setDraft((d) => ({ ...d, values: { ...d.values, [key]: value } }));

  const save = async () => {
    if (!canEdit) return; // garde-fou : jamais de PATCH sans la permission de la section
    const found = validateSectionDraft(section, draft);
    setErrors(found);
    if (Object.keys(found).length) return;
    const patch = buildSectionPatch(section, fiche, draft);
    if (!Object.keys(patch).length) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(patch);
      toast('success', 'Modifications enregistrées', section.title);
      setEditing(false);
    } catch {
      toast('error', 'Enregistrement impossible', 'Vérifiez les champs puis réessayez.');
    } finally {
      setSaving(false);
    }
  };

  const renderEditor = (field: FicheField) => {
    const value = draft.values[field.key] ?? '';
    if (field.kind === 'socials') {
      return (
        <div className="space-y-2">
          {draft.socials.map((s) => (
            <div key={s.id} className="flex items-end gap-2">
              <select
                aria-label="Plateforme"
                className={cn(selectClass, 'w-40 shrink-0')}
                value={s.plateforme}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, socials: d.socials.map((x) => (x.id === s.id ? { ...x, plateforme: e.target.value } : x)) }))
                }
              >
                <option value="">Plateforme</option>
                {RESEAU_SOCIAL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Input
                label="Adresse du profil"
                type="url"
                className="flex-1"
                value={s.url}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, socials: d.socials.map((x) => (x.id === s.id ? { ...x, url: e.target.value } : x)) }))
                }
              />
              <button
                type="button"
                aria-label="Retirer ce réseau"
                className="mb-1 rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                onClick={() => setDraft((d) => ({ ...d, socials: d.socials.filter((x) => x.id !== s.id) }))}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setDraft((d) => ({ ...d, socials: [...d.socials, { id: `new-${Date.now()}-${d.socials.length}`, plateforme: '', url: '' }] }))}
          >
            Ajouter un réseau
          </Button>
        </div>
      );
    }
    if (field.kind === 'select') {
      return (
        <label className="block">
          <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">{field.label}</span>
          <select className={selectClass} value={value} onChange={(e) => setValue(field.key, e.target.value)}>
            <option value="">Non renseigné</option>
            {(field.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      );
    }
    if (field.kind === 'textarea') {
      return (
        <label className="block">
          <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">{field.label}</span>
          <textarea
            rows={4}
            className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-900 focus:border-[#5B4DFF] focus:outline-none dark:border-white/20 dark:text-white"
            value={value}
            onChange={(e) => setValue(field.key, e.target.value)}
          />
        </label>
      );
    }
    const htmlType = field.kind === 'number' ? 'text' : field.kind; // 'number' validé à la main (entier positif)
    return (
      <Input
        label={field.label}
        type={htmlType === 'datetime' || htmlType === 'percent' ? 'text' : htmlType}
        inputMode={field.kind === 'number' ? 'numeric' : undefined}
        value={value}
        onChange={(e) => setValue(field.key, e.target.value)}
      />
    );
  };

  return (
    <section className="rounded-3xl border border-gray-200 bg-white/70 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-6">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="rounded-xl bg-[#5B4DFF]/10 p-2 text-[#5B4DFF] dark:bg-[#5B4DFF]/20"><Icon className="h-4 w-4" /></span>
          <div className="min-w-0">
            <h2 className="font-display text-base font-bold text-gray-900 dark:text-white">{section.title}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{section.description}</p>
          </div>
        </div>
        {canEdit && !editing && (
          <Button variant="secondary" size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={startEdit}>
            Modifier
          </Button>
        )}
      </header>

      {editing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {section.fields.map((field) => (
              <div key={field.key} className={cn(field.wide && 'sm:col-span-2')}>
                {renderEditor(field)}
                {errors[field.key] && <p className="mt-1 text-xs text-red-600">{errors[field.key]}</p>}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" icon={<X className="h-4 w-4" />} onClick={() => setEditing(false)} disabled={saving}>
              Annuler
            </Button>
            <Button size="sm" icon={<Check className="h-4 w-4" />} onClick={save} isLoading={saving}>
              Enregistrer
            </Button>
          </div>
        </div>
      ) : (
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {section.fields.map((field) => (
            <div key={field.key} className={cn('min-w-0', field.wide && 'sm:col-span-2')}>
              <dt className="text-xs text-gray-500 dark:text-gray-400">{field.label}</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">{renderValue(field, fiche)}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
};
