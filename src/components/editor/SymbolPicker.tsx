// ============================================================
// src/components/editor/SymbolPicker.tsx
// Petit clavier de symboles/caractères spéciaux courants -- les
// emojis eux-mêmes restent accessibles nativement via le clavier OS
// (Windows: Win+.  macOS: Cmd+Ctrl+Espace) dans n'importe quel champ
// éditable ; ce picker couvre plutôt la ponctuation/les symboles
// qu'on ne trouve pas facilement au clavier standard.
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { Smile } from 'lucide-react';

const SYMBOL_GROUPS: { label: string; symbols: string[] }[] = [
  { label: 'Emojis courants', symbols: ['😀', '😂', '😊', '😉', '👍', '🙏', '🎉', '🔥', '❤️', '⭐', '✅', '⚠️', '📌', '📷', '🎥', '📄'] },
  { label: 'Ponctuation & symboles', symbols: ['—', '–', '…', '«', '»', '\u201C', '\u201D', '\u2018', '\u2019', '•', '§', '©', '®', '™', '°', '±'] },
  { label: 'Flèches', symbols: ['→', '←', '↑', '↓', '↔', '⇒', '⇐'] },
];

interface SymbolPickerProps {
  editor: Editor;
}

export const SymbolPicker: React.FC<SymbolPickerProps> = ({ editor }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const insertSymbol = (symbol: string) => {
    editor.chain().focus().insertContent(symbol).run();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Symboles et emojis"
        className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 ${open ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
      >
        <Smile className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute z-30 top-full mt-1 left-0 w-64 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1F4D] shadow-xl space-y-2.5">
          {SYMBOL_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">{group.label}</p>
              <div className="flex flex-wrap gap-1">
                {group.symbols.map((symbol) => (
                  <button
                    key={symbol}
                    type="button"
                    onClick={() => insertSymbol(symbol)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-base hover:bg-[#5B4DFF]/10 hover:scale-110 transition-transform"
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
