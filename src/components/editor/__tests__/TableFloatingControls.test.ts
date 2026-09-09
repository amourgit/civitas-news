// ============================================================
// src/components/editor/__tests__/TableFloatingControls.test.ts
// Vérifie le cœur (headless, sans rendu React/DOM réel) des contrôles
// flottants de tableau : ciblage d'une cellule logique précise via
// TableMap, puis ajout/suppression de colonnes/lignes à un index
// arbitraire -- exactement le mécanisme utilisé par les boutons de
// TableFloatingControls. jsdom ne calcule pas de vrai layout
// (getBoundingClientRect renvoie des zéros), donc la géométrie
// visuelle du composant n'est pas testée ici ; c'est la logique de
// ciblage/édition, indépendante du DOM, qui compte.
// ============================================================

import { describe, expect, it } from 'vitest';
import { Editor, type JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TableKit } from '@tiptap/extension-table';
import { TableCellBackground } from '../extensions/TableCellBackground';
import { selectLogicalCell, currentTableSize } from '../TableFloatingControls';

function makeEditorWithTable(rows: number, cols: number) {
  const editor = new Editor({
    extensions: [StarterKit, TableKit.configure({ table: { resizable: true } }), TableCellBackground],
    content: '<p></p>',
  });
  editor.commands.insertTable({ rows, cols, withHeaderRow: true });
  return editor;
}

function tableNode(editor: Editor): JSONContent {
  const json = editor.getJSON();
  return json.content!.find((n) => n.type === 'table')!;
}

describe('TableFloatingControls -- mécanique headless', () => {
  it('rapporte la bonne taille logique du tableau', () => {
    const editor = makeEditorWithTable(2, 3);
    expect(currentTableSize(editor)).toEqual({ rows: 2, cols: 3 });
    editor.destroy();
  });

  it('ajoute une colonne à une frontière précise (pas seulement à la fin)', () => {
    const editor = makeEditorWithTable(2, 2);
    // Insère une colonne AVANT la colonne d'index 0 (tout à gauche).
    expect(selectLogicalCell(editor, 0, 0)).toBe(true);
    editor.commands.addColumnBefore();
    expect(currentTableSize(editor)).toEqual({ rows: 2, cols: 3 });
    editor.destroy();
  });

  it('ajoute une colonne à la toute fin (addColumnAfter sur la dernière)', () => {
    const editor = makeEditorWithTable(2, 2);
    expect(selectLogicalCell(editor, 0, 1)).toBe(true); // dernière colonne (index 1)
    editor.commands.addColumnAfter();
    expect(currentTableSize(editor)).toEqual({ rows: 2, cols: 3 });
    editor.destroy();
  });

  it('supprime une colonne précise au milieu du tableau', () => {
    const editor = makeEditorWithTable(1, 3);
    expect(selectLogicalCell(editor, 0, 1)).toBe(true); // colonne du milieu
    editor.commands.deleteColumn();
    expect(currentTableSize(editor)).toEqual({ rows: 1, cols: 2 });
    editor.destroy();
  });

  it('ajoute et supprime une ligne à un index précis', () => {
    const editor = makeEditorWithTable(2, 2);
    expect(selectLogicalCell(editor, 0, 0)).toBe(true);
    editor.commands.addRowBefore();
    expect(currentTableSize(editor)).toEqual({ rows: 3, cols: 2 });

    expect(selectLogicalCell(editor, 1, 0)).toBe(true); // la ligne insérée
    editor.commands.deleteRow();
    expect(currentTableSize(editor)).toEqual({ rows: 2, cols: 2 });
    editor.destroy();
  });

  it("applique une couleur de fond à une cellule via l'attribut ajouté par TableCellBackground", () => {
    const editor = makeEditorWithTable(1, 1);
    expect(selectLogicalCell(editor, 0, 0)).toBe(true);
    editor.commands.setCellAttribute('backgroundColor', '#EDE9FE');
    const table = tableNode(editor);
    const cell = table.content![0].content![0];
    expect(cell.attrs?.backgroundColor).toBe('#EDE9FE');
    editor.destroy();
  });

  it('ne fait rien (renvoie false) hors contexte de tableau', () => {
    const editor = new Editor({ extensions: [StarterKit], content: '<p>Pas de tableau ici</p>' });
    expect(selectLogicalCell(editor, 0, 0)).toBe(false);
    expect(currentTableSize(editor)).toBeNull();
    editor.destroy();
  });
});
