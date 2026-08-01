import React from 'react';
import {
  Bold,
  Italic,
  Heading,
  List,
  ListOrdered,
  Quote,
  Table,
  Code,
  Eye,
  Edit3,
  HelpCircle,
} from 'lucide-react';

export interface MarkdownToolbarProps {
  value: string;
  onChange: (newValue: string) => void;
  showPreview: boolean;
  onTogglePreview: () => void;
  textareaId?: string;
}

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({
  value,
  onChange,
  showPreview,
  onTogglePreview,
}) => {
  const insertSyntax = (before: string, after: string = '', defaultText: string = 'texte') => {
    // If no selection is easy to grab without ref, append or wrap selection
    const textarea = document.activeElement as HTMLTextAreaElement;
    if (textarea && textarea.tagName === 'TEXTAREA') {
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const selected = value.substring(start, end) || defaultText;
      const replacement = before + selected + after;
      const newValue = value.substring(0, start) + replacement + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
      }, 10);
    } else {
      // Fallback: append to end
      const addition = `\n\n${before}${defaultText}${after}`;
      onChange(value + addition);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-t-xl border border-b-0 border-gray-200 dark:border-gray-700 text-xs select-none">
      {/* Formatting Buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => insertSyntax('**', '**', 'texte gras')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold"
          title="Gras (**texte**)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertSyntax('*', '*', 'texte italique')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          title="Italique (*texte*)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertSyntax('### ', '', 'Titre de section')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          title="Titre (### Titre)"
        >
          <Heading className="w-3.5 h-3.5" />
        </button>

        <span className="text-gray-300 dark:text-gray-600">|</span>

        <button
          type="button"
          onClick={() => insertSyntax('- ', '', 'élément de liste')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          title="Liste à puces (- élément)"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertSyntax('1. ', '', 'premier point')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          title="Liste numérotée (1. élément)"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertSyntax('> ', '', 'citation importante')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          title="Citation (> texte)"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <span className="text-gray-300 dark:text-gray-600">|</span>

        <button
          type="button"
          onClick={() =>
            insertSyntax(
              '| Colonne 1 | Colonne 2 |\n| --- | --- |\n| ',
              ' | Valeur 2 |',
              'Valeur 1'
            )
          }
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          title="Tableau de données"
        >
          <Table className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => insertSyntax('`', '`', 'code')}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-mono"
          title="Code ou extrait technique"
        >
          <Code className="w-3.5 h-3.5" />
        </button>

        <span
          className="inline-flex items-center gap-1 ml-1 text-[10px] text-gray-400 dark:text-gray-500 font-medium"
          title="Prend en charge tous les formats de texte copiés depuis ChatGPT, Claude.ai, ou Google Docs (gras, tableaux, listes...)"
        >
          <HelpCircle className="w-3 h-3 text-[#5B4DFF]" />
          <span className="hidden sm:inline">Compatible Markdown / ChatGPT / Claude</span>
        </span>
      </div>

      {/* Preview Toggle Button */}
      <button
        type="button"
        onClick={onTogglePreview}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-extrabold text-xs transition-colors ${
          showPreview
            ? 'bg-[#5B4DFF] text-white shadow-sm'
            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600'
        }`}
      >
        {showPreview ? (
          <>
            <Edit3 className="w-3.5 h-3.5" />
            <span>Mode Éditeur</span>
          </>
        ) : (
          <>
            <Eye className="w-3.5 h-3.5 text-[#5B4DFF] dark:text-sky-300" />
            <span>Aperçu Rendu Enrichi</span>
          </>
        )}
      </button>
    </div>
  );
};
