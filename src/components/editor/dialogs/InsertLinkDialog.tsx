// ============================================================
// src/components/editor/dialogs/InsertLinkDialog.tsx
// ============================================================

import React, { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';

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
        <Input
          autoFocus
          label="Adresse (URL)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          placeholder="https://exemple.com"
        />
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
