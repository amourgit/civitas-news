import React, { useEffect, useState } from 'react';
import { X, Download, ExternalLink, FileText, FileSpreadsheet, FileImage, File as FileIcon, Loader2 } from 'lucide-react';
import { DocumentJoint } from '../../types/global.types';
import { formatFileSize } from '../../lib/formatNumber';
import { downloadFile } from '../../lib/downloadFile';

export interface DocumentPreviewModalProps {
  document: DocumentJoint | null;
  isOpen: boolean;
  onClose: () => void;
}

function fileKindIcon(mimeType: string | null | undefined) {
  const type = mimeType || '';
  if (type.includes('pdf')) return FileText;
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return FileSpreadsheet;
  if (type.startsWith('image/')) return FileImage;
  return FileIcon;
}

/**
 * Prévisualisation inline pour les types que le navigateur sait afficher
 * nativement (PDF via <iframe>, images via <img>) ; repli (icône + bouton
 * "Ouvrir") pour tout le reste (docx, xlsx, zip...), aucun navigateur ne
 * sachant les rendre sans plugin/service tiers.
 */
export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ document: doc, isOpen, onClose }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    setIframeLoaded(false);
  }, [doc]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !doc) return null;

  const isPdf = doc.type.includes('pdf');
  const isImage = doc.type.startsWith('image/');
  const Icon = fileKindIcon(doc.type);

  const handleDownload = async () => {
    setIsDownloading(true);
    await downloadFile(doc.url, doc.nom);
    setIsDownloading(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full sm:h-[90vh] sm:max-w-4xl bg-gray-900 sm:rounded-2xl overflow-hidden flex flex-col border border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 bg-black/40 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#5B4DFF]/15 text-[#7B61FF] flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">{doc.nom}</div>
              <div className="text-[11px] text-gray-400">{formatFileSize(doc.taille)}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 relative bg-gray-950 flex items-center justify-center">
          {isPdf && (
            <>
              {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
              <iframe
                src={doc.url}
                title={doc.nom}
                onLoad={() => setIframeLoaded(true)}
                className="w-full h-full border-0"
              />
            </>
          )}

          {isImage && (
            <img src={doc.url} alt={doc.nom} className="max-w-full max-h-full object-contain" />
          )}

          {!isPdf && !isImage && (
            <div className="flex flex-col items-center gap-3 text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-[#5B4DFF]/15 text-[#7B61FF] flex items-center justify-center">
                <Icon className="w-8 h-8" />
              </div>
              <p className="text-sm text-gray-300 max-w-xs">
                Aperçu non disponible pour ce type de fichier. Ouvrez-le ou téléchargez-le pour le consulter.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2.5 px-4 sm:px-5 py-3 bg-black/40 border-t border-white/10 shrink-0">
          <a
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ouvrir dans un nouvel onglet</span>
          </a>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5B4DFF] hover:bg-[#4d40e0] disabled:opacity-60 text-white text-xs font-bold transition-colors"
          >
            {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isDownloading ? 'Téléchargement…' : 'Télécharger'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
