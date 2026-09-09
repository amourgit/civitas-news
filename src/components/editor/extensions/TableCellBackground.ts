// ============================================================
// src/components/editor/extensions/TableCellBackground.ts
// Étend les nœuds tableCell/tableHeader (fournis par TableKit) avec un
// attribut `backgroundColor` -- non fourni nativement par
// @tiptap/extension-table. Persisté en style inline (fidèle au rendu,
// y compris dans RichContentRenderer qui partage les mêmes
// extensions au rendu lecture seule). S'applique via la commande
// native `setCellAttribute('backgroundColor', couleur)`, qui gère déjà
// nativement une sélection multi-cellules (CellSelection) -- voir
// TableFloatingControls pour le sélecteur de couleur.
// ============================================================

import { Extension } from '@tiptap/core';

export const CELL_BACKGROUND_SWATCHES: { label: string; value: string | null }[] = [
  { label: 'Aucune', value: null },
  { label: 'Violet', value: '#EDE9FE' },
  { label: 'Bleu', value: '#DBEAFE' },
  { label: 'Vert', value: '#DCFCE7' },
  { label: 'Jaune', value: '#FEF9C3' },
  { label: 'Orange', value: '#FFEDD5' },
  { label: 'Rose', value: '#FCE7F3' },
  { label: 'Gris', value: '#E5E7EB' },
];

export const TableCellBackground = Extension.create({
  name: 'tableCellBackground',

  addGlobalAttributes() {
    return [
      {
        types: ['tableCell', 'tableHeader'],
        attributes: {
          backgroundColor: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.backgroundColor || null,
            renderHTML: (attributes: { backgroundColor?: string | null }) => {
              if (!attributes.backgroundColor) return {};
              return { style: `background-color: ${attributes.backgroundColor}` };
            },
          },
        },
      },
    ];
  },
});
