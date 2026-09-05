// ============================================================
// src/components/editor/mediaViewShared.tsx
// Petits éléments visuels réutilisés par tous les NodeViews média
// (ImageBlockView, VideoBlockView, GalleryBlockView, FileAttachmentView).
// ============================================================

import React from 'react';
import { Loader2, AlertTriangle, RefreshCw, FileText, FileSpreadsheet, FileImage, File as FileIcon } from 'lucide-react';
import type { MediaAlign } from './types';

export const ALIGN_CLASSES: Record<MediaAlign, string> = {
  left: 'float-left mr-4 mb-2 max-w-[45%]',
  right: 'float-right ml-4 mb-2 max-w-[45%]',
  center: 'mx-auto',
  wide: 'w-screen max-w-[100vw] relative left-1/2 right-1/2 -mx-[50vw]',
};

export const MediaStatusBadge: React.FC<{
  pending?: boolean;
  failed?: boolean;
  onRetry?: () => void;
}> = ({ pending, failed, onRetry }) => {
  if (failed) {
    return (
      <button
        type="button"
        onClick={onRetry}
        contentEditable={false}
        className="absolute top-2 left-2 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 text-white text-[11px] font-bold shadow-lg backdrop-blur-sm hover:bg-red-700 transition-colors"
        title="L'import a échoué -- cliquez pour réessayer"
      >
        <AlertTriangle className="w-3 h-3" />
        <span>Échec</span>
        <RefreshCw className="w-3 h-3" />
      </button>
    );
  }
  if (pending) {
    return (
      <div
        contentEditable={false}
        className="absolute top-2 left-2 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-bold shadow-lg backdrop-blur-sm"
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Sera importé à l'enregistrement</span>
      </div>
    );
  }
  return null;
};

export function fileKindIcon(mimeType: string | null | undefined) {
  const type = mimeType || '';
  if (type.includes('pdf')) return FileText;
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return FileSpreadsheet;
  if (type.startsWith('image/')) return FileImage;
  return FileIcon;
}
