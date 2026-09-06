// ============================================================
// src/components/editor/extensions/FileAttachment.tsx
// ============================================================

import React from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Download, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import type { FileAttachmentAttrs } from '../types';
import { formatFileSize } from '../mediaPersistence';
import { fileKindIcon } from '../mediaViewShared';
import type { MediaNodeOptions } from './ImageBlock';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fileAttachment: {
      insertFileAttachment: (attrs: Partial<FileAttachmentAttrs>) => ReturnType;
    };
  }
}

function createFileAttachmentView(options: MediaNodeOptions): React.FC<NodeViewProps> {
  return function FileAttachmentView({ node, selected, editor, getPos }) {
    const attrs = node.attrs as FileAttachmentAttrs;
    const editable = editor.isEditable;
    const Icon = fileKindIcon(attrs.type);

    const handleRemove = () => {
      const pos = getPos();
      if (typeof pos === 'number') {
        editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
      }
    };

    return (
      <NodeViewWrapper
        as="div"
        className={`civitas-file-attachment group my-3 flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 ${selected ? 'ring-2 ring-[#5B4DFF]' : ''}`}
        contentEditable={false}
      >
        <div className="shrink-0 w-10 h-10 rounded-lg bg-[#5B4DFF]/10 flex items-center justify-center text-[#5B4DFF]">
          {attrs.pending ? <Loader2 className="w-5 h-5 animate-spin" /> : attrs.failed ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <Icon className="w-5 h-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{attrs.nom}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {attrs.pending ? 'Sera importé à l’enregistrement' : attrs.failed ? "Échec de l'import" : formatFileSize(attrs.taille)}
          </p>
        </div>
        {!attrs.pending && !attrs.failed && (
          <a
            href={attrs.src}
            download={attrs.nom}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 p-2 rounded-lg text-gray-500 hover:text-[#5B4DFF] hover:bg-[#5B4DFF]/10"
            title="Télécharger"
          >
            <Download className="w-4 h-4" />
          </a>
        )}
        {attrs.failed && attrs.tempId && (
          <button
            type="button"
            onClick={() => options.onRetryUpload(attrs.tempId as string)}
            className="shrink-0 text-xs font-bold text-red-600 hover:underline"
          >
            Réessayer
          </button>
        )}
        {editable && (
          <button
            type="button"
            onClick={handleRemove}
            className="shrink-0 hidden group-hover:flex p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </NodeViewWrapper>
    );
  };
}

export const FileAttachment = Node.create<MediaNodeOptions>({
  name: 'fileAttachment',
  group: 'block',
  atom: true,
  draggable: true,
  isolating: true,

  addOptions() {
    return { onRetryUpload: () => {} };
  },

  addAttributes() {
    return {
      src: { default: '' },
      nom: { default: '' },
      taille: { default: null },
      type: { default: null },
      mediaId: { default: null },
      tempId: { default: null },
      pending: { default: false },
      failed: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="file-attachment"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const attrs = node.attrs as FileAttachmentAttrs;
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'file-attachment', class: 'civitas-file-attachment' }),
      ['a', { href: attrs.src, download: attrs.nom, target: '_blank', rel: 'noopener noreferrer' }, attrs.nom],
    ] as any;
  },

  addNodeView() {
    return ReactNodeViewRenderer(createFileAttachmentView(this.options));
  },

  addCommands() {
    return {
      insertFileAttachment:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { nom: '', taille: null, type: null, mediaId: null, tempId: null, pending: false, failed: false, ...attrs },
          }),
    };
  },
});
