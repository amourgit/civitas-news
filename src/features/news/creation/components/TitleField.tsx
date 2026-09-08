// ============================================================
// src/features/news/creation/components/TitleField.tsx
// Pas un "champ" au sens classique : aucune bordure, aucun fond,
// aucun contour visible -- juste un grand espace de saisie, comme un
// document texte. `<textarea>` (pas `<input>`) pour pouvoir s'étendre
// sur plusieurs lignes en pleine largeur mobile, avec une hauteur qui
// suit le contenu (auto-resize via scrollHeight, aucune scrollbar
// interne visible).
// ============================================================

import React, { useLayoutEffect, useRef } from 'react';

export interface TitleFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const TitleField: React.FC<TitleFieldProps> = ({
  value,
  onChange,
  placeholder = 'Titre de votre publication…',
  disabled = false,
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={1}
      autoFocus
      className="w-full resize-none overflow-hidden bg-transparent border-0 outline-none ring-0 focus:ring-0 focus:outline-none p-0 text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 font-display disabled:opacity-60"
    />
  );
};
