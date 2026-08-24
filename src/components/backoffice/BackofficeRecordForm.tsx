// ============================================================
// src/components/backoffice/BackofficeRecordForm.tsx
// Formulaire de création/édition générique — un seul composant pour
// TOUTES les tables du backoffice : le rendu de chaque champ est piloté
// par sa déclaration dans le registre (voir registry/types.ts:FieldDef).
// ============================================================

import React, { useMemo, useState } from 'react';
import { Save, X, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { FkSelectField } from './fields/FkSelectField';
import type { FieldDef, ModelDef } from './registry/types';
import { extractFkId, toDatetimeLocalValue, toDateValue } from './utils';
import { toast } from '../../hooks/useToast';

export interface BackofficeRecordFormProps<TRecord extends Record<string, unknown>> {
  model: ModelDef<TRecord>;
  /** `undefined` -> mode création. */
  record?: TRecord;
  onSaved: (record: TRecord) => void;
  onCancel: () => void;
  canManage: boolean;
}

/** Construit l'état initial du formulaire à partir de l'enregistrement de LECTURE. */
function buildInitialValues<TRecord extends Record<string, unknown>>(
  fields: FieldDef<TRecord>[],
  record: TRecord | undefined,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = record ? (record as Record<string, unknown>)[field.name] : undefined;
    switch (field.type) {
      case 'fk':
        values[field.name] = extractFkId(raw);
        break;
      case 'datetime':
        values[field.name] = toDatetimeLocalValue(raw);
        break;
      case 'date':
        values[field.name] = toDateValue(raw);
        break;
      case 'tags':
        values[field.name] = Array.isArray(raw) ? [...raw] : [];
        break;
      case 'boolean':
        values[field.name] = Boolean(raw);
        break;
      default:
        values[field.name] = raw ?? '';
    }
  }
  return values;
}

const inputClass =
  'w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#242A5C] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4DFF] transition-all disabled:opacity-60 disabled:cursor-not-allowed';
const labelClass = 'text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5';

function TagsField({
  id, value, onChange, disabled,
}: { id?: string; value: string[]; onChange: (v: string[]) => void; disabled?: boolean }) {
  const [draft, setDraft] = useState('');
  const commit = () => {
    const clean = draft.trim();
    if (clean && !value.includes(clean)) onChange([...value, clean]);
    setDraft('');
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#242A5C] border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-[#5B4DFF]">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#5B4DFF]/10 text-[#5B4DFF] text-xs font-semibold">
          {tag}
          {!disabled && (
            <X className="w-3 h-3 cursor-pointer" onClick={() => onChange(value.filter((t) => t !== tag))} />
          )}
        </span>
      ))}
      {!disabled && (
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
          placeholder={value.length === 0 ? 'Ajouter un tag, Entrée pour valider…' : 'Ajouter…'}
          className="flex-1 min-w-[8rem] bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400 py-0.5"
        />
      )}
    </div>
  );
}

function FieldRenderer<TRecord extends Record<string, unknown>>({
  field, value, onChange, disabled, record,
}: {
  field: FieldDef<TRecord>;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled: boolean;
  record?: TRecord;
}) {
  const isReadOnly = disabled || field.readOnly;
  const fieldId = `bo-field-${field.name}`;

  if (field.type === 'fk') {
    return (
      <FkSelectField
        label={field.label}
        fkTarget={field.fkTarget!}
        labelField={field.fkLabelField}
        value={value as string | undefined}
        onChange={(id) => onChange(id)}
        required={field.required}
        nullable={!field.required}
        disabled={isReadOnly}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label htmlFor={fieldId} className={labelClass}>{field.label}{field.required && <span className="text-red-500">*</span>}</label>
        <select
          id={fieldId}
          value={(value as string) ?? ''}
          disabled={isReadOnly}
          required={field.required}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled={field.required}>— Sélectionner —</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'boolean') {
    return (
      <label htmlFor={fieldId} className="flex items-center gap-3 py-2 cursor-pointer select-none">
        <button
          id={fieldId}
          type="button"
          disabled={isReadOnly}
          onClick={() => onChange(!value)}
          className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${value ? 'bg-[#5B4DFF]' : 'bg-gray-300 dark:bg-gray-700'} ${isReadOnly ? 'opacity-60' : ''}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
        </button>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{field.label}</span>
      </label>
    );
  }

  if (field.type === 'tags') {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label htmlFor={fieldId} className={labelClass}>{field.label}</label>
        <TagsField id={fieldId} value={(value as string[]) ?? []} onChange={(v) => onChange(v)} disabled={isReadOnly} />
      </div>
    );
  }

  if (field.type === 'textarea' || field.type === 'richtext') {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label htmlFor={fieldId} className={labelClass}>{field.label}{field.required && <span className="text-red-500">*</span>}</label>
        <textarea
          id={fieldId}
          value={(value as string) ?? ''}
          disabled={isReadOnly}
          required={field.required}
          placeholder={field.placeholder}
          rows={field.type === 'richtext' ? 8 : 3}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} resize-y`}
        />
      </div>
    );
  }

  if (field.type === 'datetime') {
    return (
      <DatePicker
        label={`${field.label}${field.required ? ' *' : ''}`}
        value={(value as string) ?? ''}
        onChange={(v) => onChange(v)}
      />
    );
  }

  if (field.type === 'date') {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label htmlFor={fieldId} className={labelClass}>{field.label}</label>
        <input
          id={fieldId}
          type="date"
          value={(value as string) ?? ''}
          disabled={isReadOnly}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      </div>
    );
  }

  if (field.type === 'image' || field.type === 'file') {
    const currentUrl = typeof value === 'string' ? value : undefined;
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label htmlFor={fieldId} className={labelClass}>{field.label}</label>
        {currentUrl && field.type === 'image' && (
          <img src={currentUrl} alt="" className="w-24 h-24 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
        )}
        {!isReadOnly && (
          <input
            id={fieldId}
            type="file"
            accept={field.type === 'image' ? 'image/*' : undefined}
            disabled={isReadOnly}
            onChange={(e) => onChange(e.target.files?.[0])}
            className="text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-[#5B4DFF]/10 file:text-[#5B4DFF] file:text-xs file:font-semibold file:cursor-pointer"
          />
        )}
      </div>
    );
  }

  if (field.type === 'json-readonly' || field.type === 'badge') {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className={labelClass}>{field.label}</label>
        <p className="text-sm text-gray-600 dark:text-gray-300 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#242A5C]/50">
          {field.renderList && record ? field.renderList(value, record) : String(value ?? '—')}
        </p>
      </div>
    );
  }

  // text / number / color / défaut
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={fieldId} className={labelClass}>{field.label}{field.required && <span className="text-red-500">*</span>}</label>
      <div className="flex items-center gap-2">
        {field.type === 'color' && (
          <input
            type="color"
            value={(value as string) || '#5B4DFF'}
            disabled={isReadOnly}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 shrink-0 cursor-pointer disabled:cursor-not-allowed"
          />
        )}
        <input
          id={fieldId}
          type={field.type === 'number' ? 'number' : 'text'}
          value={(value as string | number) ?? ''}
          disabled={isReadOnly}
          required={field.required}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.type === 'number' ? e.target.valueAsNumber : e.target.value)}
          className={inputClass}
        />
      </div>
      {field.helpText && <p className="text-xs text-gray-400">{field.helpText}</p>}
    </div>
  );
}

export function BackofficeRecordForm<TRecord extends Record<string, unknown>>({
  model, record, onSaved, onCancel, canManage,
}: BackofficeRecordFormProps<TRecord>) {
  const isCreate = !record;
  const [values, setValues] = useState<Record<string, unknown>>(() => buildInitialValues(model.fields, record));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const visibleFields = useMemo(
    () => model.fields.filter((f) => !f.hiddenInForm),
    [model.fields],
  );

  const setFieldValue = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const missing = visibleFields.find(
      (f) => f.required && !f.readOnly && (values[f.name] === undefined || values[f.name] === ''),
    );
    if (missing) {
      setFormError(`Le champ « ${missing.label} » est requis.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const saved =
        isCreate && model.data.create
          ? await model.data.create(values)
          : !isCreate && model.data.update
            ? await model.data.update(String((record as Record<string, unknown>).id), values)
            : undefined;
      if (!saved) throw new Error('Cette opération n’est pas disponible pour cette table.');
      toast('success', isCreate ? `${model.labelSingular} créé(e)` : `${model.labelSingular} mis(e) à jour`);
      onSaved(saved);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue.';
      setFormError(message);
      toast('error', 'Échec de l’enregistrement', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {formError && (
        <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-sm text-red-600 dark:text-red-400">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visibleFields.map((field) => (
          <div key={field.name} className={field.type === 'textarea' || field.type === 'richtext' || field.type === 'tags' ? 'sm:col-span-2' : ''}>
            <FieldRenderer
              field={field}
              value={values[field.name]}
              onChange={(v) => setFieldValue(field.name, v)}
              disabled={!canManage}
              record={record}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
        {canManage && (
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            icon={isCreate ? <Plus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          >
            {isCreate ? 'Créer' : 'Enregistrer'}
          </Button>
        )}
      </div>
    </form>
  );
}
