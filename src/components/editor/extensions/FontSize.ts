// ============================================================
// src/components/editor/extensions/FontSize.ts
// Tiptap n'a pas d'extension officielle pour la taille de police --
// on étend la marque TextStyle (déjà utilisée par Color/Highlight)
// avec un attribut `fontSize`, en préréglages plutôt qu'en saisie
// libre pour garder une cohérence visuelle éditoriale.
// ============================================================

import { Extension } from '@tiptap/core';
import '@tiptap/extension-text-style';

export const FONT_SIZE_PRESETS = [
  { label: 'Petit', value: '13px' },
  { label: 'Normal', value: '' },
  { label: 'Moyen', value: '18px' },
  { label: 'Grand', value: '22px' },
  { label: 'Très grand', value: '28px' },
] as const;

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

export const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return { types: ['textStyle'] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (size) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});
