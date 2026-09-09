// ============================================================
// src/features/news/creation/components/NewsPreviewModal.tsx
// "Visualiser" (voir NewsCreationDock) : réutilise TEL QUEL le
// composant NewsCard (features/news/components/NewsCard.tsx) -- celui-
// là même qui liste les News sur /news -- dans une fenêtre modale.
// Aucun enregistrement, aucun appel réseau : uniquement l'état déjà en
// mémoire du formulaire (voir buildPreviewNews.ts). Les interactions de
// la card qui supposent une News déjà persistée (menu contextuel,
// réaction cœur, tiroir commentaires) sont désactivées via
// NewsCard.isPreview ; le clic carte / bouton détails sont neutralisés
// ici via onCardClick="sheet" + onOpenDetail no-op plutôt que de
// naviguer vers un slug d'aperçu qui n'existe pas côté serveur.
// ============================================================

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { News } from '../../../../types/global.types';
import { NewsCard } from '../../components/NewsCard';

export interface NewsPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  news: News;
}

const NOOP = () => {};

export const NewsPreviewModal: React.FC<NewsPreviewModalProps> = ({ isOpen, onClose, news }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Portail vers document.body : même raison que Modal.tsx (voir son
  // commentaire) -- rester positionné par rapport au VIEWPORT, jamais
  // par rapport d'un ancêtre transformé (topbar en îlot compact sous xl).
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          <span className="relative z-10 text-[11px] font-bold uppercase tracking-wider text-white/70">
            Aperçu — rien n'est encore enregistré
          </span>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-sm h-[70vh] max-h-[640px]"
          >
            <NewsCard
              news={news}
              className="h-full"
              isPreview
              onCardClick="sheet"
              onOpenDetail={NOOP}
            />
          </motion.div>

          <button
            type="button"
            onClick={onClose}
            className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
            aria-label="Fermer l'aperçu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

NewsPreviewModal.displayName = 'NewsPreviewModal';
