// ============================================================
// src/components/editor/RichTextEditor.tsx
// Éditeur riche réutilisable (d'abord branché sur News.contenu).
//
// Cycle de vie du contenu :
//  - `value` est une chaîne JSON (JSON.stringify(editor.getJSON())).
//  - Tant que `newsId` n'est pas connu (création d'une News), les
//    médias insérés restent `pending` avec un aperçu local (blob:).
//  - Dès que l'appelant connaît l'id réel (après création), il doit
//    appeler `ref.current.publishPendingMedia(newsId)` : chaque média
//    en attente est alors uploadé au vrai backend et son URL est
//    substituée dans le contenu, qui peut ensuite être enregistré.
//  - Si `newsId` est fourni dès le montage (mode édition), chaque
//    média est uploadé immédiatement à l'insertion, sans attendre un
//    flush explicite.
// ============================================================

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { Editor, JSONContent } from '@tiptap/core';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { CharacterCount } from '@tiptap/extension-character-count';
import { TextAlign } from '@tiptap/extension-text-align';
import { TableKit } from '@tiptap/extension-table';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';

import { EditorToolbar } from './EditorToolbar';
import { ImageBlock } from './extensions/ImageBlock';
import { VideoBlock } from './extensions/VideoBlock';
import { FileAttachment } from './extensions/FileAttachment';
import { GalleryBlock } from './extensions/GalleryBlock';
import { YoutubeEmbed } from './extensions/YoutubeEmbed';
import { Callout } from './extensions/Callout';
import { FontSize } from './extensions/FontSize';
import { PendingMediaRegistry } from './pendingMediaRegistry';
import { persistPendingByTempId, flushPendingMedia, setPendingByTempId } from './mediaPersistence';
import type { GalleryItem } from './types';
import './richTextEditor.css';

export interface RichTextEditorHandle {
  /** À appeler une fois l'id réel de la News connu (juste après sa création) : uploade tous les médias en attente et renvoie le contenu final prêt à enregistrer. */
  publishPendingMedia: (newsId: string) => Promise<{ content: string; failedCount: number }>;
  /** Nombre de médias encore en attente d'un id de News (utile pour avertir avant publication). */
  getPendingCount: () => number;
  /** Contenu JSON courant, sans déclencher d'upload. */
  getContentJson: () => string;
}

export interface RichTextEditorProps {
  /** Contenu initial : chaîne JSON Tiptap (JSON.stringify(doc)), ou vide pour un éditeur neuf. */
  value: string;
  onChange: (json: string) => void;
  /** Id de la News si déjà connu (mode édition) -- déclenche l'upload immédiat des médias insérés. */
  newsId?: string;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
  className?: string;
}

function parseInitialContent(value: string): JSONContent | string | undefined {
  if (!value || !value.trim()) return undefined;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && parsed.type === 'doc') return parsed as JSONContent;
  } catch {
    // Pas du JSON Tiptap : contenu hérité (Markdown/texte brut) -- affiché
    // tel quel comme point de départ plutôt que de perdre la donnée.
    // Ce cas ne se produit pas encore dans le flux de création (valeur
    // toujours vide au départ) ; il ne fait qu'anticiper une future
    // réédition d'un News existant avec cet éditeur.
  }
  return value;
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(function RichTextEditor(
  { value, onChange, newsId, placeholder, minHeight = '260px', disabled = false, className = '' },
  ref,
) {
  const editorRef = useRef<Editor | null>(null);
  const registryRef = useRef(new PendingMediaRegistry());
  const newsIdRef = useRef<string | undefined>(newsId);

  useEffect(() => {
    newsIdRef.current = newsId;
  }, [newsId]);

  useEffect(() => () => registryRef.current.releaseAll(), []);

  const handleRetryUpload = useCallback((tempId: string) => {
    const editor = editorRef.current;
    if (!editor || !newsIdRef.current) return;
    setPendingByTempId(editor, tempId);
    persistPendingByTempId(editor, registryRef.current, newsIdRef.current, tempId).catch((error) => {
      console.error('Échec du nouvel essai de persistance du média :', error);
    });
  }, []);

  /** Enregistre des fichiers locaux, insère des items "pending", et déclenche l'upload immédiat si `newsId` est déjà connu. */
  const registerAndMaybeUpload = useCallback((files: File[]): GalleryItem[] => {
    return files.map((file) => {
      const { tempId, objectUrl } = registryRef.current.register(file);
      const item: GalleryItem = { src: objectUrl, alt: '', caption: '', mediaId: null, tempId, pending: true, failed: false };
      if (newsIdRef.current) {
        persistPendingByTempId(editorRef.current as Editor, registryRef.current, newsIdRef.current, tempId).catch((error) => {
          console.error('Échec de la persistance immédiate du média :', error);
        });
      }
      return item;
    });
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank', class: 'civitas-link' },
        },
      }),
      Placeholder.configure({ placeholder: placeholder || 'Écrivez le contenu de votre article…' }),
      TextStyle,
      Color,
      FontSize,
      Highlight.configure({ multicolor: true }),
      CharacterCount,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TableKit.configure({ table: { resizable: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Subscript,
      Superscript,
      Callout,
      YoutubeEmbed,
      ImageBlock.configure({ onRetryUpload: handleRetryUpload }),
      VideoBlock.configure({ onRetryUpload: handleRetryUpload }),
      FileAttachment.configure({ onRetryUpload: handleRetryUpload }),
      GalleryBlock.configure({ onRetryUpload: handleRetryUpload, onAddFiles: registerAndMaybeUpload }),
    ],
    content: parseInitialContent(value),
    editable: !disabled,
    onUpdate: ({ editor }) => onChange(JSON.stringify(editor.getJSON())),
    editorProps: {
      attributes: { class: 'civitas-prose tiptap' },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (editor) editor.setEditable(!disabled);
  }, [editor, disabled]);

  useImperativeHandle(
    ref,
    () => ({
      publishPendingMedia: async (id: string) => {
        const currentEditor = editorRef.current;
        newsIdRef.current = id;
        if (!currentEditor) return { content: value, failedCount: 0 };
        const { failed } = await flushPendingMedia(currentEditor, registryRef.current, id);
        return { content: JSON.stringify(currentEditor.getJSON()), failedCount: failed };
      },
      getPendingCount: () => registryRef.current.size,
      getContentJson: () => JSON.stringify(editorRef.current?.getJSON() ?? {}),
    }),
    [value],
  );

  const handlePickImages = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      if (arr.length === 0) return;
      const items = registerAndMaybeUpload(arr);
      const currentEditor = editorRef.current;
      if (!currentEditor) return;
      if (items.length === 1) {
        currentEditor.chain().focus().insertImageBlock(items[0]).run();
      } else {
        currentEditor.chain().focus().insertGalleryBlock(items).run();
      }
    },
    [registerAndMaybeUpload],
  );

  const handlePickGallery = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      if (arr.length === 0) return;
      const items = registerAndMaybeUpload(arr);
      editorRef.current?.chain().focus().insertGalleryBlock(items).run();
    },
    [registerAndMaybeUpload],
  );

  const handlePickVideo = useCallback((file: File) => {
    const { tempId, objectUrl } = registryRef.current.register(file);
    const currentEditor = editorRef.current;
    if (!currentEditor) return;
    currentEditor.chain().focus().insertVideoBlock({ src: objectUrl, tempId, pending: true }).run();
    if (newsIdRef.current) {
      persistPendingByTempId(currentEditor, registryRef.current, newsIdRef.current, tempId).catch((error) => {
        console.error('Échec de la persistance immédiate de la vidéo :', error);
      });
    }
  }, []);

  const handlePickDocument = useCallback((file: File) => {
    const { tempId, objectUrl } = registryRef.current.register(file);
    const currentEditor = editorRef.current;
    if (!currentEditor) return;
    currentEditor
      .chain()
      .focus()
      .insertFileAttachment({ src: objectUrl, nom: file.name, taille: file.size, type: file.type, tempId, pending: true })
      .run();
    if (newsIdRef.current) {
      persistPendingByTempId(currentEditor, registryRef.current, newsIdRef.current, tempId).catch((error) => {
        console.error('Échec de la persistance immédiate du document :', error);
      });
    }
  }, []);

  if (!editor) return null;

  const characterCount = editor.storage.characterCount?.characters?.() ?? 0;
  const wordCount = editor.storage.characterCount?.words?.() ?? 0;

  return (
    <div className={`civitas-rich-text-editor ${className}`}>
      <EditorToolbar
        editor={editor}
        onPickImages={handlePickImages}
        onPickGallery={handlePickGallery}
        onPickVideo={handlePickVideo}
        onPickDocument={handlePickDocument}
      />
      <div
        className="rounded-b-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#151A42] px-4 py-3 overflow-y-auto"
        style={{ minHeight }}
        onClick={() => editor.chain().focus().run()}
      >
        <EditorContent editor={editor} />
      </div>
      <div className="flex items-center justify-between px-1 pt-1.5 text-[11px] text-gray-400">
        <span>
          {!newsId && registryRef.current.size > 0
            ? `${registryRef.current.size} média(s) seront importés à l'enregistrement`
            : ''}
        </span>
        <span>{wordCount} mots · {characterCount} caractères</span>
      </div>
    </div>
  );
});
