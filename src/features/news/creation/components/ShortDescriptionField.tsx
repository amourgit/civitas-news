// ============================================================
// src/features/news/creation/components/ShortDescriptionField.tsx
// Résumé bref -- distinct du contenu détaillé porté par
// ContentEditorField : alimente News.description (texte simple,
// obligatoire côté backend, déjà utilisé ailleurs comme chapeau --
// voir NewsCard.tsx et NewsDetailArticleBody.tsx). Avant ce champ,
// cette valeur était dérivée en silence du contenu détaillé
// (extractPlainTextSummary) ; elle redevient une saisie propre de
// l'auteur, pour ceux qui ne liront que ce résumé.
//
// Même esprit visuel que le contenu détaillé au-dessus de lui --
// aucune bordure/fond au repos, se fond dans la page (voir TitleField
// pour le même principe de <textarea> auto-agrandissante) -- mais
// saisie texte simple (pas de WYSIWYG), pour ne jamais se confondre
// avec le contenu détaillé : les deux valeurs restent deux champs
// d'état séparés (voir useNewsCreationForm : contenuJson vs
// descriptionCourte), envoyés séparément au backend (`contenu` vs
// `description`).
// ============================================================

import React, { useLayoutEffect, useRef } from 'react';

export interface ShortDescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const ShortDescriptionField: React.FC<ShortDescriptionFieldProps> = ({
  value,
  onChange,
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
      placeholder="Que retenons-nous en bref ?"
      disabled={disabled}
      rows={2}
      className="w-full resize-none overflow-hidden bg-transparent border-0 outline-none ring-0 focus:ring-0 focus:outline-none p-0 text-[15px] leading-[1.75] text-gray-800 dark:text-gray-200 placeholder:text-gray-300 dark:placeholder:text-gray-600 disabled:opacity-60"
    />
  );
};
