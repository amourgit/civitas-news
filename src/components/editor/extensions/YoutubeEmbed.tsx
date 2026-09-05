// ============================================================
// src/components/editor/extensions/YoutubeEmbed.tsx
// ============================================================

import React, { useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Trash2, Pencil } from 'lucide-react';
import type { YoutubeNodeAttrs } from '../types';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    youtubeEmbed: {
      insertYoutubeEmbed: (attrs: YoutubeNodeAttrs) => ReturnType;
    };
  }
}

export function extractYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  // Peut-être déjà un id brut de 11 caractères
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

const YoutubeEmbedView: React.FC<NodeViewProps> = ({ node, updateAttributes, selected, editor, getPos }) => {
  const attrs = node.attrs as YoutubeNodeAttrs;
  const [editingCaption, setEditingCaption] = useState(false);
  const editable = editor.isEditable;

  const handleRemove = () => {
    const pos = getPos();
    if (typeof pos === 'number') {
      editor.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run();
    }
  };

  return (
    <NodeViewWrapper as="figure" className={`civitas-youtube-embed group relative my-4 ${selected ? 'ring-2 ring-[#5B4DFF] rounded-xl' : ''}`}>
      <div className="relative overflow-hidden rounded-xl bg-black aspect-video">
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
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube-nocookie.com/embed/${attrs.videoId}`}
          title={attrs.caption || 'Vidéo YouTube'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
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

export const YoutubeEmbed = Node.create({
  name: 'youtubeEmbed',
  group: 'block',
  atom: true,
  draggable: true,
  isolating: true,

  addAttributes() {
    return {
      videoId: { default: '' },
      caption: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'figure[data-type="youtube-embed"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const attrs = node.attrs as YoutubeNodeAttrs;
    return [
      'figure',
      mergeAttributes(HTMLAttributes, { 'data-type': 'youtube-embed', class: 'civitas-youtube-embed' }),
      ['iframe', { src: `https://www.youtube-nocookie.com/embed/${attrs.videoId}`, allowfullscreen: 'true' }],
      ...(attrs.caption ? [['figcaption', {}, attrs.caption]] : []),
    ] as any;
  },

  addNodeView() {
    return ReactNodeViewRenderer(YoutubeEmbedView);
  },

  addCommands() {
    return {
      insertYoutubeEmbed:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});
