// ============================================================
// src/features/news/creation/components/CoverImageField.tsx
// Sélection + prévisualisation de la photo de couverture. Fonctionne
// aussi bien en création qu'en édition : le repository backend accepte
// le remplacement de l'image sur une News existante via multipart
// (news.repository.ts:update, http.update.patchWithFiles) -- seul le
// mode mock l'ignore silencieusement (pas d'upload simulé), ce qui est
// documenté et sans risque dans newsService.updateNews.
// ============================================================

import React, { useRef } from 'react';
import { ImagePlus, Repeat2, X } from 'lucide-react';

export interface CoverImageFieldProps {
  previewUrl: string | null;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export const CoverImageField: React.FC<CoverImageFieldProps> = ({
  previewUrl,
  onFileSelected,
  onRemove,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = '';
  };

  return (
    <section>
      <p className="mb-2.5 text-sm font-semibold text-gray-500 dark:text-gray-400">Photo de couverture</p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handlePick} disabled={disabled} />

      {previewUrl ? (
        <div className="relative w-full overflow-hidden rounded-2xl aspect-[16/9] bg-gray-100 dark:bg-white/5">
          <img src={previewUrl} alt="Aperçu de la couverture" className="w-full h-full object-cover" />
          {!disabled && (
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                title="Remplacer la photo"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-black/55 hover:bg-black/70 text-white backdrop-blur-sm transition-colors"
              >
                <Repeat2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onRemove}
                title="Retirer la photo"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-black/55 hover:bg-black/70 text-white backdrop-blur-sm transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl aspect-[21/9] sm:aspect-[3/1] border border-dashed border-gray-300 dark:border-gray-700 text-gray-400 hover:text-[#5B4DFF] hover:border-[#5B4DFF]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ImagePlus className="w-6 h-6" />
          <span className="text-sm font-medium">Ajouter une photo de couverture</span>
        </button>
      )}
    </section>
  );
};
