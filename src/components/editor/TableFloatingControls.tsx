// ============================================================
// src/components/editor/TableFloatingControls.tsx
// Contrôles flottants pour les tableaux -- "à la Word" : ajout et
// suppression de lignes/colonnes n'importe où dans le tableau (pas
// seulement au moment de l'insertion initiale), plus une couleur de
// fond par cellule/en-tête. Le tout discret : entièrement absent tant
// que le curseur n'est pas dans un tableau, pour ne jamais alourdir
// la mise en page comme demandé.
//
// Fonctionnement :
//  - Repère le tableau contenant le curseur (findTable) et calcule les
//    bornes de colonnes/lignes à partir du DOM réel de la <table>
//    rendue (largeur de chaque cellule de la première ligne, hauteur
//    de chaque ligne) -- pas d'un nombre de colonnes fixe au départ,
//    donc la grille peut être aussi irrégulière que l'auteur le
//    souhaite, y compris après plusieurs ajouts/suppressions.
//  - Chaque insertion/suppression déplace d'abord la sélection
//    ProseMirror sur la cellule logique concernée (via TableMap,
//    l'API utilisée en interne par les commandes natives
//    addColumnBefore/deleteRow etc.), puis déclenche la commande
//    correspondante -- aucune réimplémentation de la logique de
//    table, uniquement un ciblage précis de ce que fournit déjà
//    @tiptap/extension-table.
//  - La couleur de fond réutilise `setCellAttribute`, qui s'applique
//    nativement à toute la sélection courante (une cellule, une
//    ligne/colonne entière sélectionnée, ou un rectangle).
//  - Positionné en `fixed` (coordonnées écran, recalculées au scroll)
//    plutôt qu'en `absolute` dans le conteneur défilant de l'éditeur :
//    ce dernier n'a pas la marge nécessaire pour laisser dépasser des
//    boutons hors du tableau sans les rogner.
//
// Limite connue : les bornes visuelles sont dérivées de la première
// ligne du DOM ; une cellule fusionnée (colspan/rowspan) dans cette
// ligne peut désaligner les points d'insertion avec les colonnes
// logiques suivantes. Sans impact pour les tableaux réguliers créés
// depuis cet éditeur (aucun bouton de fusion n'est exposé).
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { isInTable, findTable, TableMap, CellSelection } from '@tiptap/pm/tables';
import { Plus, X, Palette } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { CELL_BACKGROUND_SWATCHES } from './extensions/TableCellBackground';

interface TableGeometry {
  left: number;
  top: number;
  width: number;
  height: number;
  /** N+1 décalages horizontaux (bornes de colonnes), relatifs à `left`. */
  colEdges: number[];
  /** M+1 décalages verticaux (bornes de lignes), relatifs à `top`. */
  rowEdges: number[];
}

function computeGeometry(tableEl: HTMLTableElement): TableGeometry | null {
  if (tableEl.rows.length === 0) return null;
  const rect = tableEl.getBoundingClientRect();

  const firstRow = tableEl.rows[0];
  const colEdges = [0];
  let x = 0;
  for (let i = 0; i < firstRow.cells.length; i++) {
    x += firstRow.cells[i].getBoundingClientRect().width;
    colEdges.push(x);
  }

  const rowEdges = [0];
  let y = 0;
  for (let r = 0; r < tableEl.rows.length; r++) {
    y += tableEl.rows[r].getBoundingClientRect().height;
    rowEdges.push(y);
  }

  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height, colEdges, rowEdges };
}

/** Déplace la sélection ProseMirror sur la cellule logique (row, col) du tableau contenant le curseur. Renvoie false si aucun tableau n'est trouvé. */
export function selectLogicalCell(editor: Editor, row: number, col: number): boolean {
  const { state, view } = editor;
  const found = findTable(state.selection.$from);
  if (!found) return false;
  const map = TableMap.get(found.node);
  const r = Math.max(0, Math.min(row, map.height - 1));
  const c = Math.max(0, Math.min(col, map.width - 1));
  const pos = found.start + map.positionAt(r, c, found.node);
  view.dispatch(state.tr.setSelection(new CellSelection(state.doc.resolve(pos))));
  return true;
}

export function currentTableSize(editor: Editor): { rows: number; cols: number } | null {
  const found = findTable(editor.state.selection.$from);
  if (!found) return null;
  const map = TableMap.get(found.node);
  return { rows: map.height, cols: map.width };
}

export const TableFloatingControls: React.FC<{ editor: Editor }> = ({ editor }) => {
  const [geo, setGeo] = useState<TableGeometry | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const paletteRef = useClickOutside<HTMLDivElement>(() => setPaletteOpen(false));
  const roRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    let raf = 0;
    const recompute = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!isInTable(editor.state)) {
          setGeo(null);
          return;
        }
        const found = findTable(editor.state.selection.$from);
        const dom = found ? (editor.view.nodeDOM(found.pos) as HTMLElement | null) : null;
        // TableKit enveloppe la <table> dans un .tableWrapper pour le
        // redimensionnement des colonnes -- on cible la table elle-même.
        const tableEl = dom instanceof HTMLTableElement ? dom : (dom?.querySelector('table') ?? null);
        if (!tableEl) {
          setGeo(null);
          return;
        }
        if (roRef.current) {
          roRef.current.disconnect();
          roRef.current.observe(tableEl);
        }
        setGeo(computeGeometry(tableEl));
      });
    };

    roRef.current = new ResizeObserver(recompute);
    recompute();
    editor.on('selectionUpdate', recompute);
    editor.on('transaction', recompute);
    window.addEventListener('resize', recompute);
    // capture:true -- attrape aussi le défilement du conteneur interne
    // (overflow-y-auto), qui ne fait pas remonter son événement scroll.
    window.addEventListener('scroll', recompute, true);

    return () => {
      cancelAnimationFrame(raf);
      editor.off('selectionUpdate', recompute);
      editor.off('transaction', recompute);
      window.removeEventListener('resize', recompute);
      window.removeEventListener('scroll', recompute, true);
      roRef.current?.disconnect();
    };
  }, [editor]);

  if (!geo) return null;

  const insertColumnAt = (boundary: number) => {
    const size = currentTableSize(editor);
    if (!size) return;
    if (boundary >= size.cols) {
      if (selectLogicalCell(editor, 0, size.cols - 1)) editor.chain().focus().addColumnAfter().run();
    } else if (selectLogicalCell(editor, 0, boundary)) {
      editor.chain().focus().addColumnBefore().run();
    }
  };
  const deleteColumnAt = (index: number) => {
    if (selectLogicalCell(editor, 0, index)) editor.chain().focus().deleteColumn().run();
  };
  const insertRowAt = (boundary: number) => {
    const size = currentTableSize(editor);
    if (!size) return;
    if (boundary >= size.rows) {
      if (selectLogicalCell(editor, size.rows - 1, 0)) editor.chain().focus().addRowAfter().run();
    } else if (selectLogicalCell(editor, boundary, 0)) {
      editor.chain().focus().addRowBefore().run();
    }
  };
  const deleteRowAt = (index: number) => {
    if (selectLogicalCell(editor, index, 0)) editor.chain().focus().deleteRow().run();
  };
  const applyColor = (color: string | null) => {
    editor.chain().focus().setCellAttribute('backgroundColor', color).run();
    setPaletteOpen(false);
  };

  const nCols = geo.colEdges.length - 1;
  const nRows = geo.rowEdges.length - 1;

  return (
    <div
      className="civitas-table-controls"
      style={{ position: 'fixed', left: geo.left, top: geo.top, width: geo.width, height: geo.height, zIndex: 30 }}
      contentEditable={false}
    >
      {/* Couleur des cellules -- coin supérieur gauche */}
      <div ref={paletteRef} style={{ position: 'absolute', left: -26, top: -26 }}>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setPaletteOpen((v) => !v)}
          title="Couleur des cellules"
          className="civitas-table-control-btn"
        >
          <Palette className="w-3 h-3" />
        </button>
        {paletteOpen && (
          <div className="absolute top-full left-0 mt-1 flex gap-1 p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700">
            {CELL_BACKGROUND_SWATCHES.map((swatch) => (
              <button
                key={swatch.label}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyColor(swatch.value)}
                title={swatch.label}
                className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10 shrink-0 flex items-center justify-center"
                style={{ backgroundColor: swatch.value ?? 'transparent' }}
              >
                {!swatch.value && <X className="w-3 h-3 text-gray-400" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Colonnes -- suppression au centre de chaque colonne, insertion à chaque frontière (avant la 1re, entre chaque paire, après la dernière). */}
      <div style={{ position: 'absolute', left: 0, top: -20, width: geo.width, height: 18 }}>
        {Array.from({ length: nCols }, (_, i) => (
          <button
            key={`col-del-${i}`}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => deleteColumnAt(i)}
            title="Supprimer la colonne"
            className="civitas-table-control-btn"
            style={{ position: 'absolute', left: (geo.colEdges[i] + geo.colEdges[i + 1]) / 2 - 9, top: 0 }}
          >
            <X className="w-3 h-3" />
          </button>
        ))}
        {Array.from({ length: nCols + 1 }, (_, i) => (
          <button
            key={`col-add-${i}`}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertColumnAt(i)}
            title="Ajouter une colonne ici"
            className="civitas-table-control-btn civitas-table-control-btn--seam"
            style={{ position: 'absolute', left: geo.colEdges[i] - 7, top: 0 }}
          >
            <Plus className="w-2.5 h-2.5" />
          </button>
        ))}
      </div>

      {/* Lignes -- suppression au centre de chaque ligne, insertion à chaque frontière. */}
      <div style={{ position: 'absolute', left: -20, top: 0, width: 18, height: geo.height }}>
        {Array.from({ length: nRows }, (_, i) => (
          <button
            key={`row-del-${i}`}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => deleteRowAt(i)}
            title="Supprimer la ligne"
            className="civitas-table-control-btn"
            style={{ position: 'absolute', left: 0, top: (geo.rowEdges[i] + geo.rowEdges[i + 1]) / 2 - 9 }}
          >
            <X className="w-3 h-3" />
          </button>
        ))}
        {Array.from({ length: nRows + 1 }, (_, i) => (
          <button
            key={`row-add-${i}`}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertRowAt(i)}
            title="Ajouter une ligne ici"
            className="civitas-table-control-btn civitas-table-control-btn--seam"
            style={{ position: 'absolute', left: 0, top: geo.rowEdges[i] - 7 }}
          >
            <Plus className="w-2.5 h-2.5" />
          </button>
        ))}
      </div>
    </div>
  );
};
