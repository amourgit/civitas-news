// ============================================================
// src/components/editor/EditorToolbar.tsx
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Code2,
  List, ListOrdered, ListChecks, Quote, Link2, Image as ImageIcon,
  Images, Film, Youtube, FileUp, Table as TableIcon, Minus, Undo2, Redo2,
  ChevronDown, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Highlighter, Palette, Type, Subscript as SubscriptIcon, Superscript as SuperscriptIcon,
  MessageSquareQuote, Eraser,
} from 'lucide-react';
import { SymbolPicker } from './SymbolPicker';
import { InsertLinkDialog } from './dialogs/InsertLinkDialog';
import { InsertYoutubeDialog } from './dialogs/InsertYoutubeDialog';
import { FONT_SIZE_PRESETS } from './extensions/FontSize';
import type { CalloutVariant } from './types';

const TEXT_COLORS = ['#1A1F4D', '#5B4DFF', '#EF4444', '#F59E0B', '#10B981', '#0EA5E9', '#EC4899', '#6B7280'];
const HIGHLIGHT_COLORS = ['#FEF08A', '#BBF7D0', '#BFDBFE', '#FBCFE8', '#FED7AA'];

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onOutside]);
  return ref;
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}> = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
      active ? 'bg-[#5B4DFF] text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`}
  >
    {children}
  </button>
);

const Divider = () => <span className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 shrink-0" />;

const Dropdown: React.FC<{ trigger: React.ReactNode; title: string; children: (close: () => void) => React.ReactNode }> = ({ trigger, title, children }) => {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        title={title}
        className={`flex items-center gap-0.5 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${open ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
      >
        {trigger}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute z-30 top-full mt-1 left-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1A1F4D] shadow-xl overflow-hidden">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
};

const HEADING_LEVELS = [1, 2, 3, 4] as const;
const CALLOUT_VARIANTS: { value: CalloutVariant; label: string }[] = [
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Succès' },
  { value: 'warning', label: 'Avertissement' },
  { value: 'danger', label: 'Danger' },
];

export interface EditorToolbarProps {
  editor: Editor;
  onPickImages: (files: FileList | File[]) => void;
  onPickGallery: (files: FileList | File[]) => void;
  onPickVideo: (file: File) => void;
  onPickDocument: (file: File) => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor, onPickImages, onPickGallery, onPickVideo, onPickDocument }) => {
  const [linkOpen, setLinkOpen] = useState(false);
  const [youtubeOpen, setYoutubeOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const [, forceRerender] = useState(0);
  useEffect(() => {
    const rerender = () => forceRerender((n) => n + 1);
    editor.on('selectionUpdate', rerender);
    editor.on('transaction', rerender);
    return () => {
      editor.off('selectionUpdate', rerender);
      editor.off('transaction', rerender);
    };
  }, [editor]);

  const activeHeading = HEADING_LEVELS.find((level) => editor.isActive('heading', { level }));

  return (
    <div className="civitas-editor-toolbar sticky top-0 z-20 flex flex-wrap items-center gap-0.5 p-1.5 rounded-t-xl border border-b-0 border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-[#151A42]/95 backdrop-blur-sm">
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Annuler (Ctrl+Z)">
        <Undo2 className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rétablir (Ctrl+Y)">
        <Redo2 className="w-4 h-4" />
      </ToolbarButton>

      <Divider />

      <Dropdown title="Style de texte" trigger={<Type className="w-4 h-4" />}>
        {(close) => (
          <div className="w-44 py-1">
            <button
              onClick={() => { editor.chain().focus().setParagraph().run(); close(); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${!activeHeading ? 'font-bold text-[#5B4DFF]' : ''}`}
            >
              Paragraphe
            </button>
            {HEADING_LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => { editor.chain().focus().toggleHeading({ level }).run(); close(); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${activeHeading === level ? 'font-bold text-[#5B4DFF]' : ''}`}
              >
                Titre {level}
              </button>
            ))}
          </div>
        )}
      </Dropdown>

      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Gras (Ctrl+B)">
        <Bold className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italique (Ctrl+I)">
        <Italic className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Souligné (Ctrl+U)">
        <UnderlineIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Barré">
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Code en ligne">
        <Code className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Indice">
        <SubscriptIcon className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Exposant">
        <SuperscriptIcon className="w-4 h-4" />
      </ToolbarButton>

      <Divider />

      <Dropdown title="Taille du texte" trigger={<span className="text-xs font-bold">Taille</span>}>
        {(close) => (
          <div className="w-36 py-1">
            {FONT_SIZE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  if (preset.value) editor.chain().focus().setFontSize(preset.value).run();
                  else editor.chain().focus().unsetFontSize().run();
                  close();
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                style={preset.value ? { fontSize: preset.value } : undefined}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </Dropdown>

      <Dropdown title="Couleur du texte" trigger={<Palette className="w-4 h-4" />}>
        {(close) => (
          <div className="p-2 grid grid-cols-4 gap-1.5 w-36">
            {TEXT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => { editor.chain().focus().setColor(color).run(); close(); }}
                style={{ backgroundColor: color }}
                className="w-6 h-6 rounded-full border border-black/10 hover:scale-110 transition-transform"
              />
            ))}
            <button
              onClick={() => { editor.chain().focus().unsetColor().run(); close(); }}
              title="Réinitialiser"
              className="col-span-4 mt-1 text-[11px] text-gray-500 hover:text-[#5B4DFF]"
            >
              Réinitialiser
            </button>
          </div>
        )}
      </Dropdown>

      <Dropdown title="Surlignage" trigger={<Highlighter className="w-4 h-4" />}>
        {(close) => (
          <div className="p-2 grid grid-cols-3 gap-1.5 w-32">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => { editor.chain().focus().toggleHighlight({ color }).run(); close(); }}
                style={{ backgroundColor: color }}
                className="w-6 h-6 rounded-full border border-black/10 hover:scale-110 transition-transform"
              />
            ))}
            <button
              onClick={() => { editor.chain().focus().unsetHighlight().run(); close(); }}
              title="Retirer"
              className="col-span-3 mt-1 text-[11px] text-gray-500 hover:text-[#5B4DFF]"
            >
              Retirer
            </button>
          </div>
        )}
      </Dropdown>

      <Divider />

      <Dropdown
        title="Alignement"
        trigger={
          editor.isActive({ textAlign: 'center' }) ? <AlignCenter className="w-4 h-4" /> :
          editor.isActive({ textAlign: 'right' }) ? <AlignRight className="w-4 h-4" /> :
          editor.isActive({ textAlign: 'justify' }) ? <AlignJustify className="w-4 h-4" /> :
          <AlignLeft className="w-4 h-4" />
        }
      >
        {(close) => (
          <div className="flex p-1">
            {([
              ['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight], ['justify', AlignJustify],
            ] as const).map(([value, Icon]) => (
              <button
                key={value}
                onClick={() => { editor.chain().focus().setTextAlign(value).run(); close(); }}
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${editor.isActive({ textAlign: value }) ? 'text-[#5B4DFF]' : 'text-gray-600 dark:text-gray-300'}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        )}
      </Dropdown>

      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Liste à puces">
        <List className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Liste numérotée">
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Liste de tâches">
        <ListChecks className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citation">
        <Quote className="w-4 h-4" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Bloc de code">
        <Code2 className="w-4 h-4" />
      </ToolbarButton>

      <Dropdown title="Encadré" trigger={<MessageSquareQuote className="w-4 h-4" />}>
        {(close) => (
          <div className="w-40 py-1">
            {CALLOUT_VARIANTS.map((variant) => (
              <button
                key={variant.value}
                onClick={() => { editor.chain().focus().setCallout(variant.value).run(); close(); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {variant.label}
              </button>
            ))}
          </div>
        )}
      </Dropdown>

      <Divider />

      <ToolbarButton onClick={() => setLinkOpen(true)} active={editor.isActive('link')} title="Insérer un lien">
        <Link2 className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton onClick={() => imageInputRef.current?.click()} title="Insérer une ou plusieurs images">
        <ImageIcon className="w-4 h-4" />
      </ToolbarButton>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) onPickImages(e.target.files); e.target.value = ''; }}
      />

      <ToolbarButton onClick={() => galleryInputRef.current?.click()} title="Créer une galerie d'images">
        <Images className="w-4 h-4" />
      </ToolbarButton>
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) onPickGallery(e.target.files); e.target.value = ''; }}
      />

      <ToolbarButton onClick={() => videoInputRef.current?.click()} title="Insérer une vidéo (fichier)">
        <Film className="w-4 h-4" />
      </ToolbarButton>
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) onPickVideo(e.target.files[0]); e.target.value = ''; }}
      />

      <ToolbarButton onClick={() => setYoutubeOpen(true)} title="Insérer une vidéo YouTube">
        <Youtube className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton onClick={() => documentInputRef.current?.click()} title="Joindre un document">
        <FileUp className="w-4 h-4" />
      </ToolbarButton>
      <input
        ref={documentInputRef}
        type="file"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) onPickDocument(e.target.files[0]); e.target.value = ''; }}
      />

      <ToolbarButton
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Insérer un tableau (3×3)"
      >
        <TableIcon className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Ligne de séparation">
        <Minus className="w-4 h-4" />
      </ToolbarButton>

      <SymbolPicker editor={editor} />

      <Divider />

      <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Effacer la mise en forme">
        <Eraser className="w-4 h-4" />
      </ToolbarButton>

      <InsertLinkDialog editor={editor} isOpen={linkOpen} onClose={() => setLinkOpen(false)} />
      <InsertYoutubeDialog editor={editor} isOpen={youtubeOpen} onClose={() => setYoutubeOpen(false)} />
    </div>
  );
};
