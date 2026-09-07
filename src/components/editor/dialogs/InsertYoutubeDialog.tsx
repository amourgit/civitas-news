// ============================================================
// src/components/editor/dialogs/InsertYoutubeDialog.tsx
// ============================================================

import React, { useState } from 'react';
import type { Editor } from '@tiptap/core';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { extractYoutubeVideoId } from '../extensions/YoutubeEmbed';

interface InsertYoutubeDialogProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
}

export const InsertYoutubeDialog: React.FC<InsertYoutubeDialogProps> = ({ editor, isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    const videoId = extractYoutubeVideoId(url);
    if (!videoId) {
      setError('Lien YouTube invalide -- collez le lien complet de la vidéo.');
      return;
    }
    editor.chain().focus().insertYoutubeEmbed({ videoId, caption: caption.trim() }).run();
    setUrl('');
    setCaption('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Insérer une vidéo YouTube" maxWidth="sm">
      <div className="space-y-4">
        <div>
          <Input
            autoFocus
            label="Lien YouTube"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError('');
            }}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
        <Input
          label="Légende (optionnel)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          placeholder="Légende affichée sous la vidéo..."
        />
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={handleConfirm}>
            Insérer
          </Button>
        </div>
      </div>
    </Modal>
  );
};
