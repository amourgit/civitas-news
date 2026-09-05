// ============================================================
// src/components/editor/dialogs/InsertLinkDialog.tsx
// ============================================================

import React, { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Link2 } from 'lucide-react';

interface InsertLinkDialogProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
}

export const InsertLinkDialog: React.FC<InsertLinkDialogProps> = ({ editor, isOpen, onClose }) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUrl(editor.getAttributes('link').href || '');
    }
  }, [isOpen, editor]);

  const handleConfirm = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().unsetLink().run();
    } else {
      const href = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    onClose();
  };

  const handleRemove = () => {
    editor.chain().focus().unsetLink().run();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Insérer un lien" maxWidth="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Adresse (URL)</label>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus-within:ring-1 focus-within:ring-[#5B4DFF]">
            <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              placeholder="https://exemple.com"
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          {editor.isActive('link') && (
            <Button variant="ghost" size="sm" onClick={handleRemove}>
              Retirer le lien
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={handleConfirm}>
            Valider
          </Button>
        </div>
      </div>
    </Modal>
  );
};
