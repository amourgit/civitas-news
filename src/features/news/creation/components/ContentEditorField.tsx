// ============================================================
// src/features/news/creation/components/ContentEditorField.tsx
// Le corps de la publication. Un seul champ, visuellement libre (même
// esprit que TitleField : aucune bordure, aucun fond au repos), mais
// porté par l'éditeur riche complet (RichTextEditor, TipTap) plutôt
// qu'un textarea Markdown + bascule d'aperçu manuelle : ce qui
// s'affiche PENDANT la saisie EST déjà le rendu final (WYSIWYG),
// images/tableaux/galeries/citations compris.
//
// Ce champ remplace à la fois l'ancien "résumé synthétique"
// (News.description, Markdown) et l'ancien "texte détaillé"
// (News.contenu, JSON Tiptap) par un seul contenu riche, envoyé comme
// `contenu`. `News.description` reste néanmoins nécessaire ailleurs
// dans l'app (chapeau de la NewsCard, recherche, fil -- voir
// NewsCard.tsx et NewsDetailArticleBody.tsx) : `extractPlainTextSummary`
// en dérive un résumé texte brut à l'enregistrement, sans jamais
// exposer un second champ à l'auteur.
// ============================================================

import React from 'react';
import type { JSONContent } from '@tiptap/core';
import { RichTextEditor, type RichTextEditorHandle } from '../../../../components/editor/RichTextEditor';

export interface ContentEditorFieldProps {
  value: string;
  onChange: (json: string) => void;
  newsId?: string;
  disabled?: boolean;
}

export const ContentEditorField = React.forwardRef<RichTextEditorHandle, ContentEditorFieldProps>(
  function ContentEditorField({ value, onChange, newsId, disabled }, ref) {
    return (
      <RichTextEditor
        ref={ref}
        variant="bare"
        value={value}
        onChange={onChange}
        newsId={newsId}
        disabled={disabled}
        minHeight="140px"
        placeholder="Racontez ce qui se passe : contexte, objectifs, propositions… insérez images, tableaux ou documents directement ici."
      />
    );
  },
);

/** Concatène récursivement les nœuds texte d'un document Tiptap. */
function walkText(node: JSONContent, chunks: string[]): void {
  if (typeof node.text === 'string') chunks.push(node.text);
  if (node.type === 'paragraph' || node.type === 'heading') chunks.push('\u0000'); // marqueur de coupure de bloc
  node.content?.forEach((child) => walkText(child, chunks));
}

/**
 * Dérive un résumé texte brut (sans mise en forme) depuis le contenu
 * riche JSON, pour peupler `News.description` (requis par le backend,
 * utilisé comme chapeau ailleurs dans l'app) sans demander à l'auteur
 * de dupliquer sa saisie. Retombe sur une chaîne vide si le contenu
 * est vide ou pas encore du JSON Tiptap valide.
 */
export function extractPlainTextSummary(contentJson: string, maxLength = 220): string {
  if (!contentJson || !contentJson.trim()) return '';
  let doc: JSONContent;
  try {
    doc = JSON.parse(contentJson);
  } catch {
    return contentJson.slice(0, maxLength);
  }
  const chunks: string[] = [];
  walkText(doc, chunks);
  const text = chunks
    .join('')
    .split('\u0000')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
