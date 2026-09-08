// ============================================================
// src/features/news/creation/components/ShortDescriptionField.tsx
// Résumé bref -- distinct du contenu détaillé porté par
// ContentEditorField : alimente News.description (obligatoire côté
// backend, déjà utilisé ailleurs comme chapeau texte brut -- voir
// NewsCard.tsx, rendu tel quel sans passer par un moteur de rendu
// riche). Avant ce champ, cette valeur était dérivée en silence du
// contenu détaillé (extractPlainTextSummary) ; elle redevient une
// saisie propre de l'auteur, dans le même éditeur riche (mise en
// forme, tableaux, symboles...) que le contenu détaillé, pour un
// confort de rédaction identique.
//
// Le JSON Tiptap saisi ici n'est PAS enregistré tel quel : à la
// soumission (voir useNewsCreationForm), il est réduit en texte brut
// via extractPlainTextSummary avant d'être envoyé comme `description`
// -- les usages existants de ce champ (chapeau de carte, recherche,
// fil) affichent la valeur brute sans interprétation Markdown/HTML.
// Un média inséré ici (image, tableau...) enrichit donc la saisie
// mais ne survit pas à l'enregistrement ; pas d'upload immédiat/newsId
// câblé ici pour cette raison (contrairement à ContentEditorField).
// ============================================================

import React from 'react';
import { RichTextEditor } from '../../../../components/editor/RichTextEditor';

export interface ShortDescriptionFieldProps {
  /** Chaîne JSON Tiptap (comme ContentEditorField), pas du texte brut. */
  value: string;
  onChange: (json: string) => void;
  disabled?: boolean;
}

export const ShortDescriptionField: React.FC<ShortDescriptionFieldProps> = ({ value, onChange, disabled }) => (
  <RichTextEditor
    variant="bare"
    value={value}
    onChange={onChange}
    disabled={disabled}
    minHeight="52px"
    placeholder="Que retenons-nous en bref ?"
  />
);
