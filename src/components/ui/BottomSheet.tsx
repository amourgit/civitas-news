import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Panneau générique qui glisse du bas de l'écran vers le haut, occupe
 * 80vh de hauteur et toute la largeur de l'écran. Ne connaît RIEN du
 * contenu qu'il affiche (news, sondage, ou tout autre futur usage) --
 * c'est un simple conteneur, au même titre que `Modal.tsx` mais avec
 * une présentation "feuille du bas" plutôt que centrée. Le contenu est
 * fourni via `children` par l'appelant (voir GlobalBottomSheet.tsx +
 * store/bottomSheet.store.ts pour l'instance globale utilisée par les
 * cards).
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, children }) => {
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

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 h-[80vh] w-full bg-white dark:bg-[#1A1F4D] rounded-t-3xl shadow-[0_-16px_48px_rgba(26,31,77,0.25)] overflow-hidden flex flex-col"
          >
            {/* Poignée de glissement (purement visuelle) */}
            <div className="shrink-0 flex justify-center pt-2.5 pb-1">
              <div className="w-10 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>

            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Contenu défilable */}
            <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
