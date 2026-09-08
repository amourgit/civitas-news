// ============================================================
// src/features/news/creation/components/MediaGallerySection.tsx
// Dernière section du mode standard : galerie d'images et documents
// joints, distincts des images insérées à même le corps du texte
// (celles-là passent par la barre d'outils de ContentEditorField).
// Purement présentationnel : tout l'état (fichiers en attente,
// éléments déjà persistés récupérés en édition) vit dans
// useNewsCreationForm.ts, pour rester réutilisable et testable.
// ============================================================

import React, { useRef } from 'react';
import { ImagePlus, Paperclip, FileText, X } from 'lucide-react';

export interface GalleryDisplayItem {
  id: string;
  previewUrl: string;
}

export interface DocumentDisplayItem {
  id: string;
  nom: string;
  url?: string;
}

export interface MediaGallerySectionProps {
  galleryItems: GalleryDisplayItem[];
  documentItems: DocumentDisplayItem[];
  onAddGalleryFiles: (files: FileList) => void;
  onRemoveGalleryItem: (id: string) => void;
  onAddDocumentFiles: (files: FileList) => void;
  onRemoveDocumentItem: (id: string) => void;
  disabled?: boolean;
}

const AddTile: React.FC<{ onClick: () => void; icon: React.ReactNode; label: string; disabled?: boolean }> = ({
  onClick,
  icon,
  label,
  disabled,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={label}
    className="flex shrink-0 flex-col items-center justify-center gap-1 w-20 h-20 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-400 hover:text-[#5B4DFF] hover:border-[#5B4DFF]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {icon}
    <span className="text-[10px] font-medium">Ajouter</span>
  </button>
);

export const MediaGallerySection: React.FC<MediaGallerySectionProps> = ({
  galleryItems,
  documentItems,
  onAddGalleryFiles,
  onRemoveGalleryItem,
  onAddDocumentFiles,
  onRemoveDocumentItem,
  disabled = false,
}) => {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="space-y-6">
      <div>
        <p className="mb-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400">Galerie photo</p>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && onAddGalleryFiles(e.target.files)}
        />
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {galleryItems.map((item) => (
            <div key={item.id} className="relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5">
              <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onRemoveGalleryItem(item.id)}
                  className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 rounded-full bg-black/60 text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          {!disabled && (
            <AddTile onClick={() => galleryInputRef.current?.click()} icon={<ImagePlus className="w-5 h-5" />} label="Ajouter des photos" />
          )}
        </div>
      </div>

      <div>
        <p className="mb-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400">Documents</p>
        <input
          ref={documentInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && onAddDocumentFiles(e.target.files)}
        />
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          {documentItems.map((item) => (
            <div
              key={item.id}
              className="relative flex shrink-0 items-center gap-2 max-w-[13rem] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-white/[0.04] pl-3 pr-8 py-2.5"
            >
              <FileText className="w-4 h-4 shrink-0 text-gray-400" />
              <span className="truncate text-xs font-medium text-gray-700 dark:text-gray-200">{item.nom}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onRemoveDocumentItem(item.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full text-gray-400 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          {!disabled && (
            <AddTile onClick={() => documentInputRef.current?.click()} icon={<Paperclip className="w-5 h-5" />} label="Joindre des documents" />
          )}
        </div>
      </div>
    </section>
  );
};
