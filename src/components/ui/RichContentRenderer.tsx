// ============================================================
// src/components/ui/RichContentRenderer.tsx
// Remplace progressivement RichTextViewer pour le champ News.contenu :
// tout contenu déjà publié avant l'arrivée de l'éditeur riche reste du
// Markdown brut (rendu par RichTextViewer, inchangé) ; tout contenu
// créé/modifié avec le nouvel éditeur est une chaîne JSON Tiptap,
// rendue ici via un éditeur en lecture seule utilisant EXACTEMENT les
// mêmes extensions/NodeViews que l'édition (voir RichTextEditor),
// garantissant un rendu identique entre rédaction et publication --
// médias, tableaux, galeries, encadrés, etc. avec tous leurs styles.
// ============================================================

import React, { useMemo } from 'react';
import { useEditor, EditorContent, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { TableKit } from '@tiptap/extension-table';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';

import { ImageBlock } from '../editor/extensions/ImageBlock';
import { VideoBlock } from '../editor/extensions/VideoBlock';
import { FileAttachment } from '../editor/extensions/FileAttachment';
import { GalleryBlock } from '../editor/extensions/GalleryBlock';
import { YoutubeEmbed } from '../editor/extensions/YoutubeEmbed';
import { Callout } from '../editor/extensions/Callout';
import { FontSize } from '../editor/extensions/FontSize';
import '../editor/richTextEditor.css';
import { RichTextViewer } from './RichTextViewer';

export interface RichContentRendererProps {
  content: string;
  className?: string;
  compact?: boolean;
  articleSize?: boolean;
}

function parseTiptapDoc(content: string): JSONContent | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && parsed.type === 'doc') return parsed as JSONContent;
  } catch {
    return null;
  }
  return null;
}

const TiptapReadOnlyView: React.FC<{ doc: JSONContent; articleSize?: boolean }> = ({ doc, articleSize }) => {
  const editor = useEditor(
    {
      editable: false,
      content: doc,
      extensions: [
        StarterKit.configure({
          link: { HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank', class: 'civitas-link' } },
        }),
        TextStyle,
        Color,
        FontSize,
        Highlight.configure({ multicolor: true }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        TableKit,
        TaskList,
        TaskItem.configure({ nested: true }),
        Subscript,
        Superscript,
        Callout,
        YoutubeEmbed,
        ImageBlock,
        VideoBlock,
        FileAttachment,
        GalleryBlock,
      ],
      editorProps: {
        attributes: { class: `civitas-prose tiptap ${articleSize ? 'civitas-prose--article' : ''}` },
      },
    },
    [doc],
  );

  return <EditorContent editor={editor} />;
};

export const RichContentRenderer: React.FC<RichContentRendererProps> = ({ content, className, compact, articleSize }) => {
  const doc = useMemo(() => parseTiptapDoc(content || ''), [content]);

  if (!content) return null;

  if (doc) {
    return (
      <div className={className}>
        <TiptapReadOnlyView doc={doc} articleSize={articleSize} />
      </div>
    );
  }

  // Contenu hérité (Markdown, publié avant l'éditeur riche) -- rendu inchangé.
  return <RichTextViewer content={content} className={className} compact={compact} articleSize={articleSize} />;
};
