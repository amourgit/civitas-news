// ============================================================
// src/components/editor/dialogs/InsertYoutubeDialog.tsx
// ============================================================

import React, { useState } from 'react';
import type { Editor } from '@tiptap/core';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
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
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Lien YouTube</label>
          <input
            autoFocus
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError('');
            }}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-[#5B4DFF]"
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Légende (optionnel)</label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            placeholder="Légende affichée sous la vidéo..."
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-1 focus:ring-[#5B4DFF]"
          />
        </div>
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={handleConfirm}>
            Insérer
          </Button>
        </div>
      </div>
    </Modal>
  );
};
