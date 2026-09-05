// ============================================================
// src/components/editor/extensions/ImageBlock.tsx
// Nœud "image" enrichi : légende, crédit photo, alignement, et cycle
// de vie pending -> persistée -> (éventuellement) échouée. Remplace
// l'extension @tiptap/extension-image officielle (trop pauvre pour
// nos besoins éditoriaux) par un nœud custom avec NodeView React.
// ============================================================

import React, { useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { AlignLeft, AlignCenter, AlignRight, Maximize2, Trash2, Pencil } from 'lucide-react';
import type { ImageNodeAttrs, MediaAlign } from '../types';
import { ALIGN_CLASSES, MediaStatusBadge } from '../mediaViewShared';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageBlock: {
      insertImageBlock: (attrs: Partial<ImageNodeAttrs>) => ReturnType;
    };
  }
}

export interface MediaNodeOptions {
  /** Relance la persistance d'un média en attente identifié par son tempId (voir RichTextEditor). */
  onRetryUpload: (tempId: string) => void;
}

function createImageBlockView(options: MediaNodeOptions): React.FC<NodeViewProps> {
  return function ImageBlockView({ node, updateAttributes, selected, editor, getPos }) {
  const attrs = node.attrs as ImageNodeAttrs;
  const [editingCaption, setEditingCaption] = useState(false);
  const editable = editor.isEditable;

  const setAlign = (align: MediaAlign) => updateAttributes({ align });

  const handleRetry = () => {
    if (attrs.tempId) options.onRetryUpload(attrs.tempId);
  };

  const handleRemove = () => {
    const pos = getPos();
    if (typeof pos === 'number') {
      editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
    }
  };

  return (
    <NodeViewWrapper
      as="figure"
      className={`civitas-image-block group relative my-4 ${ALIGN_CLASSES[attrs.align] || ''} ${selected ? 'ring-2 ring-[#5B4DFF] rounded-xl' : ''}`}
      data-align={attrs.align}
    >
      <div className="relative overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
        <MediaStatusBadge pending={attrs.pending} failed={attrs.failed} onRetry={handleRetry} />

        {editable && (
          <div
            contentEditable={false}
            className="absolute top-2 right-2 z-10 hidden group-hover:flex items-center gap-1 p-1 rounded-lg bg-black/60 backdrop-blur-sm shadow-lg"
          >
            <button type="button" onClick={() => setAlign('left')} title="Aligner à gauche" className={`p-1.5 rounded text-white hover:bg-white/20 ${attrs.align === 'left' ? 'bg-[#5B4DFF]' : ''}`}>
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => setAlign('center')} title="Centrer" className={`p-1.5 rounded text-white hover:bg-white/20 ${attrs.align === 'center' ? 'bg-[#5B4DFF]' : ''}`}>
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => setAlign('right')} title="Aligner à droite" className={`p-1.5 rounded text-white hover:bg-white/20 ${attrs.align === 'right' ? 'bg-[#5B4DFF]' : ''}`}>
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => setAlign('wide')} title="Pleine largeur" className={`p-1.5 rounded text-white hover:bg-white/20 ${attrs.align === 'wide' ? 'bg-[#5B4DFF]' : ''}`}>
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <span className="w-px h-4 bg-white/30 mx-0.5" />
            <button type="button" onClick={() => setEditingCaption(true)} title="Légende & crédit" className="p-1.5 rounded text-white hover:bg-white/20">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={handleRemove} title="Supprimer" className="p-1.5 rounded text-white hover:bg-red-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <img
          src={attrs.src}
          alt={attrs.alt || ''}
          loading="lazy"
          decoding="async"
          width={attrs.width || undefined}
          height={attrs.height || undefined}
          className={`w-full h-auto block ${attrs.pending ? 'opacity-70' : ''}`}
        />
      </div>

      {editable && editingCaption ? (
        <div contentEditable={false} className="mt-2 space-y-1.5">
          <input
            autoFocus
            value={attrs.caption}
            onChange={(e) => updateAttributes({ caption: e.target.value })}
            onBlur={() => setEditingCaption(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingCaption(false)}
            placeholder="Légende de l'image..."
            className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-[#5B4DFF]"
          />
          <input
            value={attrs.credit}
            onChange={(e) => updateAttributes({ credit: e.target.value })}
            placeholder="Crédit photo (optionnel)..."
            className="w-full px-2.5 py-1.5 text-[11px] rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-[#5B4DFF]"
          />
          <input
            value={attrs.alt}
            onChange={(e) => updateAttributes({ alt: e.target.value })}
            placeholder="Texte alternatif (accessibilité)..."
            className="w-full px-2.5 py-1.5 text-[11px] rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-[#5B4DFF]"
          />
        </div>
      ) : (
        (attrs.caption || attrs.credit) && (
          <figcaption
            onClick={() => editable && setEditingCaption(true)}
            className={`mt-2 text-xs text-center text-gray-500 dark:text-gray-400 ${editable ? 'cursor-text hover:text-[#5B4DFF]' : ''}`}
          >
            {attrs.caption}
            {attrs.credit && <span className="italic opacity-70"> — {attrs.credit}</span>}
          </figcaption>
        )
      )}
    </NodeViewWrapper>
  );
  };
}

export const ImageBlock = Node.create<MediaNodeOptions>({
  name: 'imageBlock',
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
      alt: { default: '' },
      caption: { default: '' },
      credit: { default: '' },
      align: { default: 'center' },
      width: { default: null },
      height: { default: null },
      mediaId: { default: null },
      tempId: { default: null },
      pending: { default: false },
      failed: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'figure[data-type="image-block"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const attrs = node.attrs as ImageNodeAttrs;
    return [
      'figure',
      mergeAttributes(HTMLAttributes, { 'data-type': 'image-block', 'data-align': attrs.align, class: 'civitas-image-block' }),
      ['img', { src: attrs.src, alt: attrs.alt, loading: 'lazy' }],
      ...(attrs.caption || attrs.credit
        ? [['figcaption', {}, [attrs.caption, attrs.credit ? ` — ${attrs.credit}` : ''].filter(Boolean).join('')]]
        : []),
    ] as any;
  },

  addNodeView() {
    return ReactNodeViewRenderer(createImageBlockView(this.options));
  },

  addCommands() {
    return {
      insertImageBlock:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { align: 'center', alt: '', caption: '', credit: '', mediaId: null, tempId: null, pending: false, failed: false, ...attrs },
          }),
    };
  },
});
