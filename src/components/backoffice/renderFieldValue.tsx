// ============================================================
// src/components/backoffice/renderFieldValue.tsx
// Rendu d'affichage (LECTURE SEULE) d'une valeur de champ dans une
// colonne du tableau liste — partagé par `BackofficeDataTable`
// (colonnes non éditables) et `BackofficeEditableCell` (état "hors
// édition" des colonnes éditables, avant clic). Un seul point de
// vérité pour "comment afficher ce type de champ", quel que soit le
// modèle.
// ============================================================

import React from 'react';
import { Badge } from '../ui/Badge';
import type { FieldDef } from './registry/types';
import { formatListDate } from './utils';

export function renderFieldValue<TRecord extends Record<string, unknown>>(
  field: FieldDef<TRecord>,
  record: TRecord,
): React.ReactNode {
  const raw = (record as Record<string, unknown>)[field.name];

  if (field.renderList) return field.renderList(raw, record);

  switch (field.type) {
    case 'boolean':
      return raw ? (
        <Badge variant="success" size="sm">Oui</Badge>
      ) : (
        <Badge variant="default" size="sm">Non</Badge>
      );
    case 'fk': {
      if (raw && typeof raw === 'object') {
        const nested = raw as Record<string, unknown>;
        const label = (nested.nom ?? nested.titre ?? nested.nomAffiche ?? nested.id) as string | undefined;
        return label ?? '—';
      }
      return raw ? String(raw) : '—';
    }
    case 'date':
    case 'datetime':
      return formatListDate(raw);
    case 'image':
      return raw && typeof raw === 'string'
        ? <img src={raw} alt="" className="w-9 h-9 rounded-lg object-cover" />
        : '—';
    case 'tags':
      return Array.isArray(raw) && raw.length > 0 ? `${raw.length} tag${raw.length > 1 ? 's' : ''}` : '—';
    case 'select': {
      const option = field.options?.find((o) => o.value === raw);
      return option?.label ?? (raw ? String(raw) : '—');
    }
    case 'json-readonly':
      return raw !== undefined && raw !== null ? String(raw) : '—';
    default:
      if (raw === null || raw === undefined || raw === '') return '—';
      if (typeof raw === 'string' && raw.length > 60) return `${raw.slice(0, 60)}…`;
      return String(raw);
  }
}
