// ============================================================
// src/components/backoffice/BackofficeEditableCell.tsx
// Cellule éditable du tableau liste générique — un seul composant pour
// TOUS les types de champ de TOUTES les tables du backoffice. Le
// contrôle rendu (interrupteur, menu déroulant, champ de saisie,
// panneau) est piloté par `field.type`, exactement comme
// `BackofficeRecordForm` pilote le rendu du formulaire de détail —
// les deux partagent `buildInitialValues` (voir utils.ts) pour
// garantir que l'édition en ligne envoie à `model.data.update`
// exactement le même payload que l'édition en page dédiée.
//
// Principe : au clic sur une cellule éditable, on modifie UNE valeur,
// on la fusionne dans un instantané complet de l'enregistrement
// courant (`buildInitialValues`), puis on appelle `model.data.update`
// avec cet objet complet — jamais un payload partiel construit à la
// main, pour rester valide quel que soit ce que chaque
// `<model>.registry.ts` attend en écriture.
// ============================================================

import React, { useRef, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { FkSelectField } from './fields/FkSelectField';
import { InlineCellPopover } from './fields/InlineCellPopover';
import { InlineSelectField } from './fields/InlineSelectField';
import { TagsField } from './fields/TagsField';
import { renderFieldValue } from './renderFieldValue';
import type { FieldDef, FieldType, ModelDef } from './registry/types';
import { buildInitialValues, extractFkId, toDateValue, toDatetimeLocalValue } from './utils';
import { toast } from '../../hooks/useToast';

/** Types dont l'édition en ligne n'a pas de sens ou n'est pas prise en
 * charge par l'API (image : upload de fichier ; json-readonly/badge :
 * valeurs calculées côté serveur) — inchangés par rapport à
 * l'affichage actuel, jamais rendus cliquables. */
const NON_INLINE_EDITABLE_TYPES: FieldType[] = ['image', 'file', 'json-readonly', 'badge'];

const hoverableTextClass =
  'cursor-text rounded-lg px-1.5 py-1 -mx-1.5 -my-1 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors';
const popoverActionsClass = 'flex items-center justify-end gap-2 pt-1';
const cancelBtnClass = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800';
const saveBtnClass =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#5B4DFF] text-white hover:bg-[#7B61FF] disabled:opacity-60 disabled:cursor-not-allowed';

export interface BackofficeEditableCellProps<TRecord extends Record<string, unknown>> {
  model: ModelDef<TRecord>;
  field: FieldDef<TRecord>;
  record: TRecord;
  /** L'utilisateur a le droit d'éditer cette table (permission +
   * capacité `edit` + `model.data.update` disponible). */
  canEdit: boolean;
  /** Appelé avec l'enregistrement renvoyé par l'API après un
   * enregistrement réussi, pour que le tableau parent mette à jour sa
   * liste locale sans tout recharger. */
  onSaved: (record: TRecord) => void;
}

export function BackofficeEditableCell<TRecord extends Record<string, unknown>>({
  model, field, record, canEdit, onSaved,
}: BackofficeEditableCellProps<TRecord>) {
  const [isSaving, setIsSaving] = useState(false);
  const raw = (record as Record<string, unknown>)[field.name];

  const isEditable =
    canEdit && !field.readOnly && !!model.data.update && !NON_INLINE_EDITABLE_TYPES.includes(field.type);

  if (!isEditable) {
    return <>{renderFieldValue(field, record)}</>;
  }

  const isEmpty = (v: unknown) =>
    v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

  /** Fusionne la nouvelle valeur dans un instantané complet de
   * l'enregistrement (même forme que le formulaire) et appelle
   * `model.data.update`. Renvoie `true` en cas de succès, pour que
   * l'appelant sache s'il peut refermer son mode édition. */
  const commit = async (newValue: unknown): Promise<boolean> => {
    if (field.required && isEmpty(newValue)) {
      toast('error', 'Champ requis', `« ${field.label} » ne peut pas être vide.`);
      return false;
    }
    setIsSaving(true);
    try {
      const values = buildInitialValues(model.fields, record);
      values[field.name] = newValue;
      const updated = await model.data.update!(String((record as Record<string, unknown>).id), values);
      onSaved(updated);
      toast('success', `${field.label} mis à jour`);
      return true;
    } catch (err) {
      toast('error', `Échec de la mise à jour de « ${field.label} »`, err instanceof Error ? err.message : undefined);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  switch (field.type) {
    case 'boolean':
      return <BooleanCell value={Boolean(raw)} isSaving={isSaving} onToggle={() => commit(!raw)} />;

    case 'select':
      return (
        <InlineSelectField
          options={field.options ?? []}
          value={raw as string | undefined}
          nullable={!field.required}
          isSaving={isSaving}
          onChange={(v) => commit(v)}
        />
      );

    case 'fk':
      return (
        <FkSelectField
          compact
          label={field.label}
          fkTarget={field.fkTarget!}
          labelField={field.fkLabelField}
          value={extractFkId(raw)}
          nullable={!field.required}
          isSaving={isSaving}
          onChange={(id) => commit(id)}
        />
      );

    case 'textarea':
    case 'richtext':
      return <LongTextCell field={field} raw={raw} isSaving={isSaving} onCommit={commit} />;

    case 'tags':
      return <TagsCell raw={raw} isSaving={isSaving} onCommit={commit} />;

    case 'text':
    case 'number':
    case 'color':
    case 'date':
    case 'datetime':
      return <SimpleInputCell field={field} raw={raw} record={record} isSaving={isSaving} onCommit={commit} />;

    default:
      return <>{renderFieldValue(field, record)}</>;
  }
}

// ------------------------------------------------------------
// Booléen : interrupteur cliquable, enregistrement immédiat.
// ------------------------------------------------------------
function BooleanCell({ value, isSaving, onToggle }: { value: boolean; isSaving: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      disabled={isSaving}
      onClick={onToggle}
      aria-pressed={value}
      className="inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 -mx-1 -my-0.5 hover:ring-2 hover:ring-[#5B4DFF]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isSaving ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
      ) : value ? (
        <Badge variant="success" size="sm">Oui</Badge>
      ) : (
        <Badge variant="default" size="sm">Non</Badge>
      )}
    </button>
  );
}

// ------------------------------------------------------------
// text / number / color / date / datetime : clic pour activer un
// champ de saisie in-situ, Entrée/blur pour enregistrer, Échap pour
// annuler.
// ------------------------------------------------------------
function toDraftValue<TRecord extends Record<string, unknown>>(field: FieldDef<TRecord>, raw: unknown): string {
  switch (field.type) {
    case 'date':
      return toDateValue(raw);
    case 'datetime':
      return toDatetimeLocalValue(raw);
    case 'color':
      return typeof raw === 'string' && raw ? raw : '#5B4DFF';
    case 'number':
      return raw === null || raw === undefined || raw === '' ? '' : String(raw);
    default:
      return typeof raw === 'string' ? raw : raw !== null && raw !== undefined ? String(raw) : '';
  }
}

function SimpleInputCell<TRecord extends Record<string, unknown>>({
  field, raw, record, isSaving, onCommit,
}: {
  field: FieldDef<TRecord>;
  raw: unknown;
  record: TRecord;
  isSaving: boolean;
  onCommit: (value: unknown) => Promise<boolean>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const skipNextBlurRef = useRef(false);

  const startEditing = () => {
    setDraft(toDraftValue(field, raw));
    setIsEditing(true);
  };

  const finish = async (shouldCommit: boolean) => {
    if (!shouldCommit) {
      setIsEditing(false);
      return;
    }
    const original = toDraftValue(field, raw);
    if (draft === original) {
      setIsEditing(false);
      return;
    }
    const value = field.type === 'number' ? (draft === '' ? undefined : Number(draft)) : draft;
    const ok = await onCommit(value);
    if (ok) setIsEditing(false);
    // en cas d'échec on reste en édition, avec la saisie de l'utilisateur intacte
  };

  if (!isEditing) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={startEditing}
        onKeyDown={(e) => {
          if (e.key === 'Enter') startEditing();
        }}
        className={hoverableTextClass}
      >
        {renderFieldValue(field, record)}
      </div>
    );
  }

  const inputType =
    field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'datetime' ? 'datetime-local' : 'text';

  return (
    <div className="flex items-center gap-1.5">
      {field.type === 'color' && (
        <input
          type="color"
          value={draft || '#5B4DFF'}
          disabled={isSaving}
          onChange={(e) => setDraft(e.target.value)}
          className="w-6 h-6 rounded border border-gray-200 dark:border-gray-700 shrink-0 cursor-pointer disabled:cursor-not-allowed"
        />
      )}
      <input
        autoFocus
        type={inputType}
        value={draft}
        disabled={isSaving}
        placeholder={field.placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            skipNextBlurRef.current = true;
            finish(true);
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            skipNextBlurRef.current = true;
            finish(false);
          }
        }}
        onBlur={() => {
          if (skipNextBlurRef.current) {
            skipNextBlurRef.current = false;
            return;
          }
          finish(true);
        }}
        className="w-full min-w-[6rem] px-2 py-1 rounded-lg bg-gray-50 dark:bg-[#242A5C] border border-[#5B4DFF] text-sm text-gray-900 dark:text-white focus:outline-none disabled:opacity-60"
      />
      {isSaving && <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-gray-400" />}
    </div>
  );
}

// ------------------------------------------------------------
// textarea / richtext : clic pour ouvrir un panneau avec
// Enregistrer/Annuler explicites (contenu trop long pour un simple
// blur-to-save).
// ------------------------------------------------------------
function LongTextCell<TRecord extends Record<string, unknown>>({
  field, raw, isSaving, onCommit,
}: {
  field: FieldDef<TRecord>;
  raw: unknown;
  isSaving: boolean;
  onCommit: (value: unknown) => Promise<boolean>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const handleSave = async () => {
    const ok = await onCommit(draft);
    if (ok) setIsOpen(false);
  };

  const preview = typeof raw === 'string' && raw ? (raw.length > 60 ? `${raw.slice(0, 60)}…` : raw) : '—';

  return (
    <InlineCellPopover
      isOpen={isOpen}
      disabled={isSaving}
      panelMinWidth={320}
      triggerClassName="block w-full"
      onOpenChange={(open) => {
        if (open) {
          setDraft(typeof raw === 'string' ? raw : '');
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      }}
      trigger={<div className={`${hoverableTextClass} block truncate max-w-xs`}>{preview}</div>}
    >
      <div className="p-3 flex flex-col gap-2 w-80">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300">{field.label}</label>
        <textarea
          autoFocus
          rows={field.type === 'richtext' ? 8 : 4}
          value={draft}
          disabled={isSaving}
          placeholder={field.placeholder}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-[#242A5C] border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white resize-y focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]"
        />
        <div className={popoverActionsClass}>
          <button type="button" disabled={isSaving} onClick={() => setIsOpen(false)} className={cancelBtnClass}>
            Annuler
          </button>
          <button type="button" disabled={isSaving} onClick={handleSave} className={saveBtnClass}>
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Enregistrer
          </button>
        </div>
      </div>
    </InlineCellPopover>
  );
}

// ------------------------------------------------------------
// tags : clic pour ouvrir un panneau avec le même éditeur de tags que
// le formulaire, Enregistrer/Annuler explicites.
// ------------------------------------------------------------
function TagsCell({
  raw, isSaving, onCommit,
}: {
  raw: unknown;
  isSaving: boolean;
  onCommit: (value: unknown) => Promise<boolean>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);

  const handleSave = async () => {
    const ok = await onCommit(draft);
    if (ok) setIsOpen(false);
  };

  const count = Array.isArray(raw) ? raw.length : 0;

  return (
    <InlineCellPopover
      isOpen={isOpen}
      disabled={isSaving}
      panelMinWidth={288}
      triggerClassName="block w-full"
      onOpenChange={(open) => {
        if (open) {
          setDraft(Array.isArray(raw) ? [...(raw as string[])] : []);
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      }}
      trigger={<div className={hoverableTextClass}>{count > 0 ? `${count} tag${count > 1 ? 's' : ''}` : '—'}</div>}
    >
      <div className="p-3 flex flex-col gap-2 w-72">
        <TagsField value={draft} onChange={setDraft} disabled={isSaving} autoFocus />
        <div className={popoverActionsClass}>
          <button type="button" disabled={isSaving} onClick={() => setIsOpen(false)} className={cancelBtnClass}>
            Annuler
          </button>
          <button type="button" disabled={isSaving} onClick={handleSave} className={saveBtnClass}>
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Enregistrer
          </button>
        </div>
      </div>
    </InlineCellPopover>
  );
}
