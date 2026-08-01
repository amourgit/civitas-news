import React, { useState } from 'react';
import { News, Sujet, TypeReaction } from '../../../types/global.types';
import { useNewsReactions } from '../hooks/useNewsReactions';
import { Share2, QrCode, Flag, Bookmark, Eye } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { LienQrCode } from '../../liens/components/LienQrCode';
import { toast } from '../../../hooks/useToast';
import { useClipboard } from '../../../hooks/useClipboard';

export interface NewsActionsBarProps {
  news?: News;
  sujet?: News;
  onUpdate?: (updated: News) => void;
}

const EMOJI_MAP: Record<TypeReaction, { emoji: string; label: string }> = {
  coeur: { emoji: '❤️', label: 'J’adore' },
  jaime: { emoji: '👍', label: 'J’aime' },
  bravo: { emoji: '👏', label: 'Bravo' },
  youpi: { emoji: '🎉', label: 'Génial' },
  wow: { emoji: '😮', label: 'Impressionnant' },
  jaimepas: { emoji: '👎', label: 'Pas d’accord' },
};

export const NewsActionsBar: React.FC<NewsActionsBarProps> = ({ news, sujet, onUpdate }) => {
  const currentItem = news || sujet;
  if (!currentItem) return null;

  const { react } = useNewsReactions(currentItem.id, onUpdate);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const { copy } = useClipboard();

  const handleShareCopy = async () => {
    const success = await copy(window.location.href);
    if (success) {
      toast('success', 'Lien copié !', 'Le lien de la news a été copié dans votre presse-papier.');
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsReportOpen(false);
    toast('info', 'Signalement transmis', 'Merci d’aider à préserver un espace d’information sain.');
  };

  return (
    <div className="w-full bg-white dark:bg-[#1A1F4D] rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm mb-8 flex flex-wrap items-center justify-between gap-4">
      {/* Reactions WhatsApp/Slack style */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {(Object.keys(EMOJI_MAP) as TypeReaction[]).map((type) => {
          const count = currentItem.stats.reactions[type] || 0;
          const isSelected = currentItem.userReaction === type;
          return (
            <button
              key={type}
              onClick={() => react(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-90 ${
                isSelected
                  ? 'bg-[#5B4DFF] text-white shadow-md shadow-[#5B4DFF]/30 scale-105'
                  : 'bg-gray-100 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-base">{EMOJI_MAP[type].emoji}</span>
              <span>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Action Buttons: Share, QR, Report */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleShareCopy}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 transition-colors"
          title="Copier le lien"
        >
          <Share2 className="w-4 h-4 text-[#5B4DFF]" />
          <span>Partager</span>
        </button>

        <button
          onClick={() => setIsQrOpen(true)}
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
          title="Générer QR Code"
        >
          <QrCode className="w-4 h-4 text-[#7B61FF]" />
        </button>

        <button
          onClick={() => setIsReportOpen(true)}
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-600 transition-colors"
          title="Signaler"
        >
          <Flag className="w-4 h-4" />
        </button>
      </div>

      {/* QR Code Modal */}
      <Modal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} title="QR Code & Diffusion">
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <LienQrCode url={window.location.href} title={currentItem.titre} />
          <p className="text-xs text-gray-500 mt-4 max-w-xs">
            Scannez ce QR Code pour accéder directement à cette publication.
          </p>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} title="Signaler cette News">
        <form onSubmit={handleReportSubmit} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Pour quel motif souhaitez-vous signaler cette news au comité de modération ?
          </p>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
          >
            <option value="spam">Spam ou publicité non sollicitée</option>
            <option value="propos_inappropries">Propos inappropriés ou haineux</option>
            <option value="desinformation">Désinformation ou fausse nouvelle</option>
            <option value="harcelement">Harcèlement ciblé</option>
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsReportOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700"
            >
              Envoyer le signalement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export const SujetActionsBar = NewsActionsBar;
export type SujetActionsBarProps = NewsActionsBarProps;

