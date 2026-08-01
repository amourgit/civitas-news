import React from 'react';
import { News, Sujet } from '../../../types/global.types';
import { RichTextViewer } from '../../../components/ui/RichTextViewer';
import { Sparkles, FileText } from 'lucide-react';

export interface NewsContenuProps {
  news?: News;
  sujet?: News;
}

export const NewsContenu: React.FC<NewsContenuProps> = ({ news, sujet }) => {
  const currentItem = news || sujet;
  if (!currentItem) return null;

  return (
    <div className="bg-white dark:bg-[#1A1F4D] rounded-none p-3 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-sm mb-3">
      {/* Section Title */}
      <div className="flex items-center gap-2 mb-4 border-b pb-2.5 border-gray-100 dark:border-gray-800">
        <FileText className="w-5 h-5 text-[#5B4DFF]" />
        <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white font-display">
          Contenu & Informations
        </h2>
      </div>

      {/* Brief Description Callout Box (when different from detailed content) */}
      {currentItem.description &&
        currentItem.contenu &&
        currentItem.description.trim() !== currentItem.contenu.trim() && (
          <div className="mb-5 p-3.5 sm:p-4 rounded-xl bg-[#5B4DFF]/5 dark:bg-[#5B4DFF]/10 border-l-4 border-[#5B4DFF] text-gray-800 dark:text-gray-200 text-xs sm:text-sm font-semibold leading-relaxed shadow-sm">
            <div className="flex items-center gap-1.5 text-[#5B4DFF] dark:text-sky-300 font-extrabold text-xs mb-1 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Résumé synthétique</span>
            </div>
            <RichTextViewer content={currentItem.description} compact />
          </div>
        )}

      {/* Main Rich Text Content & Objectives Render */}
      <div className="my-2">
        <RichTextViewer content={currentItem.contenu || currentItem.description} />
      </div>

      {/* Tags */}
      {currentItem.tags && currentItem.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-5 pt-3 border-t border-gray-100 dark:border-gray-800">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Mots-clés :
          </span>
          {currentItem.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export const SujetContenu = NewsContenu;
export type SujetContenuProps = NewsContenuProps;


