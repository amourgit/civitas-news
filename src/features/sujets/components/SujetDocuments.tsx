import React from 'react';
import { DocumentJoint } from '../../../types/global.types';
import { FileText, Download } from 'lucide-react';
import { formatFileSize } from '../../../lib/formatNumber';

export interface SujetDocumentsProps {
  documents?: DocumentJoint[];
}

export const SujetDocuments: React.FC<SujetDocumentsProps> = ({ documents }) => {
  if (!documents || !documents.length) return null;

  return (
    <div className="bg-white dark:bg-[#1A1F4D] rounded-none p-1.5 sm:p-2 border border-gray-100 dark:border-gray-800 shadow-sm mb-3">
      <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white font-display mb-2 flex items-center gap-1.5">
        <FileText className="w-4 h-4 text-[#5B4DFF]" />
        Documents Joints ({documents.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-1.5 rounded-none bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 hover:border-[#5B4DFF]/40 transition-all text-xs"
          >
            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 rounded-none bg-purple-100 dark:bg-purple-950/60 text-[#5B4DFF] flex items-center justify-center shrink-0">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {doc.nom}
                </div>
                <div className="text-[10px] text-gray-400">{formatFileSize(doc.taille)}</div>
              </div>
            </div>
            <a
              href={doc.url}
              download
              onClick={(e) => {
                e.preventDefault();
                alert(`Téléchargement simulé de ${doc.nom}`);
              }}
              className="p-1 rounded-none bg-white dark:bg-gray-700 text-[#5B4DFF] dark:text-white hover:bg-[#5B4DFF] hover:text-white transition-colors shadow-sm"
              title="Télécharger"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
