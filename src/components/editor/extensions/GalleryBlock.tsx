// ============================================================
// src/components/editor/extensions/GalleryBlock.tsx
// Mini-galerie d'images intégrée au fil du contenu (distincte de la
// "Galerie Médias" dédiée de la page de détail, curée séparément via
// newsGalerieRepository) : un ensemble d'images liées entre elles,
// affichées en carrousel avec lightbox au clic, aussi bien en édition
// qu'en lecture (même NodeView monté dans les deux cas).
// ============================================================

import React, { useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Plus, X, ChevronLeft, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';
import type { GalleryItem, GalleryNodeAttrs } from '../types';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    galleryBlock: {
      insertGalleryBlock: (items: GalleryItem[]) => ReturnType;
    };
  }
}

export interface GalleryNodeOptions {
  onRetryUpload: (tempId: string) => void;
  /** Enregistre les fichiers choisis dans le registre en attente et renvoie les items prêts à insérer (aperçu local, upload différé ou immédiat selon le mode). */
  onAddFiles: (files: File[]) => GalleryItem[];
}

function createGalleryBlockView(options: GalleryNodeOptions): React.FC<NodeViewProps> {
  return function GalleryBlockView({ node, updateAttributes, selected, editor }) {
    const attrs = node.attrs as GalleryNodeAttrs;
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const editable = editor.isEditable;
    const fileInputId = React.useId();

    const handleAddFiles = (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const newItems = options.onAddFiles(Array.from(fileList));
      updateAttributes({ items: [...attrs.items, ...newItems] });
    };

    const handleRemoveItem = (index: number) => {
      const nextItems = attrs.items.filter((_, i) => i !== index);
      updateAttributes({ items: nextItems });
    };

    return (
      <NodeViewWrapper
        className={`civitas-gallery-block relative my-4 ${selected ? 'ring-2 ring-[#5B4DFF] rounded-xl p-1' : ''}`}
        contentEditable={false}
      >
        <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
          {attrs.items.map((item, index) => (
            <div
              key={item.tempId || item.mediaId || index}
              className="relative shrink-0 w-40 h-40 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 snap-start group/item cursor-pointer"
              onClick={() => setLightboxIndex(index)}
            >
              {item.pending && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
              {item.failed && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.tempId) options.onRetryUpload(item.tempId);
                  }}
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-red-600/80 text-white text-[11px] font-bold"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Réessayer
                </button>
              )}
              <img src={item.src} alt={item.alt || ''} loading="lazy" className="w-full h-full object-cover" />
              {editable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveItem(index);
                  }}
                  className="absolute top-1 right-1 z-10 hidden group-hover/item:flex p-1 rounded-full bg-black/70 text-white hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          {editable && (
            <label
              htmlFor={fileInputId}
              className="shrink-0 w-40 h-40 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#5B4DFF] hover:text-[#5B4DFF] cursor-pointer transition-colors"
            >
              <Plus className="w-6 h-6" />
              <span className="text-[11px] font-medium">Ajouter</span>
              <input
                id={fileInputId}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleAddFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          )}
        </div>

        {lightboxIndex !== null && attrs.items[lightboxIndex] && (
          <div
            className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-6"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : attrs.items.length - 1));
              }}
              className="absolute left-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <img
              src={attrs.items[lightboxIndex].src}
              alt={attrs.items[lightboxIndex].alt || ''}
              className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i !== null && i < attrs.items.length - 1 ? i + 1 : 0));
              }}
              className="absolute right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </button>
            {attrs.items[lightboxIndex].caption && (
              <p className="absolute bottom-6 text-center text-white/80 text-sm max-w-lg">
                {attrs.items[lightboxIndex].caption}
              </p>
            )}
          </div>
        )}
      </NodeViewWrapper>
    );
  };
}

export const GalleryBlock = Node.create<GalleryNodeOptions>({
  name: 'galleryBlock',
  group: 'block',
  atom: true,
  draggable: true,
  isolating: true,

  addOptions() {
    return { onRetryUpload: () => {}, onAddFiles: () => [] };
  },

  addAttributes() {
    return {
      items: { default: [] as GalleryItem[] },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="gallery-block"]' }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const attrs = node.attrs as GalleryNodeAttrs;
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'gallery-block', class: 'civitas-gallery-block' }),
      ...attrs.items.map((item) => ['img', { src: item.src, alt: item.alt || '' }]),
    ] as any;
  },

  addNodeView() {
    return ReactNodeViewRenderer(createGalleryBlockView(this.options));
  },

  addCommands() {
    return {
      insertGalleryBlock:
        (items) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { items } }),
    };
  },
});
