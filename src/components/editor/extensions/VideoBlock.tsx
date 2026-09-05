// ============================================================
// src/components/editor/extensions/VideoBlock.tsx
// Nœud "vidéo" pour un fichier vidéo uploadé (distinct de
// YoutubeEmbed qui gère les liens YouTube sans upload).
// ============================================================

import React, { useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Trash2, Pencil } from 'lucide-react';
import type { VideoNodeAttrs } from '../types';
import { MediaStatusBadge } from '../mediaViewShared';
import type { MediaNodeOptions } from './ImageBlock';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    videoBlock: {
      insertVideoBlock: (attrs: Partial<VideoNodeAttrs>) => ReturnType;
    };
  }
}

function createVideoBlockView(options: MediaNodeOptions): React.FC<NodeViewProps> {
  return function VideoBlockView({ node, updateAttributes, selected, editor, getPos }) {
    const attrs = node.attrs as VideoNodeAttrs;
    const [editingCaption, setEditingCaption] = useState(false);
    const editable = editor.isEditable;

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
        className={`civitas-video-block group relative my-4 ${selected ? 'ring-2 ring-[#5B4DFF] rounded-xl' : ''}`}
      >
        <div className="relative overflow-hidden rounded-xl bg-black">
          <MediaStatusBadge pending={attrs.pending} failed={attrs.failed} onRetry={handleRetry} />

          {editable && (
            <div
              contentEditable={false}
              className="absolute top-2 right-2 z-10 hidden group-hover:flex items-center gap-1 p-1 rounded-lg bg-black/60 backdrop-blur-sm shadow-lg"
            >
              <button type="button" onClick={() => setEditingCaption(true)} title="Légende" className="p-1.5 rounded text-white hover:bg-white/20">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={handleRemove} title="Supprimer" className="p-1.5 rounded text-white hover:bg-red-500">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={attrs.src}
            poster={attrs.poster || undefined}
            controls
            className={`w-full h-auto max-h-[520px] block ${attrs.pending ? 'opacity-70' : ''}`}
          />
        </div>

        {editable && editingCaption ? (
          <input
            autoFocus
            contentEditable={false}
            value={attrs.caption}
            onChange={(e) => updateAttributes({ caption: e.target.value })}
            onBlur={() => setEditingCaption(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingCaption(false)}
            placeholder="Légende de la vidéo..."
            className="mt-2 w-full px-2.5 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-[#5B4DFF]"
          />
        ) : (
          attrs.caption && (
            <figcaption
              onClick={() => editable && setEditingCaption(true)}
              className={`mt-2 text-xs text-center text-gray-500 dark:text-gray-400 ${editable ? 'cursor-text hover:text-[#5B4DFF]' : ''}`}
            >
              {attrs.caption}
            </figcaption>
          )
        )}
      </NodeViewWrapper>
    );
  };
}

export const VideoBlock = Node.create<MediaNodeOptions>({
  name: 'videoBlock',
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
      poster: { default: null },
      caption: { default: '' },
      mediaId: { default: null },
      tempId: { default: null },
      pending: { default: false },
      failed: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'figure[data-type="video-block"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const attrs = node.attrs as VideoNodeAttrs;
    return [
      'figure',
      mergeAttributes(HTMLAttributes, { 'data-type': 'video-block', class: 'civitas-video-block' }),
      ['video', { src: attrs.src, controls: 'true', poster: attrs.poster || undefined }],
      ...(attrs.caption ? [['figcaption', {}, attrs.caption]] : []),
    ] as any;
  },

  addNodeView() {
    return ReactNodeViewRenderer(createVideoBlockView(this.options));
  },

  addCommands() {
    return {
      insertVideoBlock:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { caption: '', poster: null, mediaId: null, tempId: null, pending: false, failed: false, ...attrs },
          }),
    };
  },
});
