import React, { useState } from 'react';
import { Link2, Check, Facebook, Twitter, Linkedin, MessageCircle, Mail, QrCode, Flag, Share2 } from 'lucide-react';
import { News } from '../../../../../types/global.types';
import { useClipboard } from '../../../../../hooks/useClipboard';
import { toast } from '../../../../../hooks/useToast';
import { newsService } from '../../../../../services/api/news.service';
import { adminService } from '../../../../../services/api/admin.service';
import { Modal } from '../../../../../components/ui/Modal';
import { LienQrCode } from '../../../../liens/components/LienQrCode';
import { SidebarWidgetCard } from './SidebarWidgetCard';

export interface ShareWidgetProps {
  news: News;
  onUpdate?: (updated: News) => void;
}

type MotifSignalement = 'spam' | 'propos_inappropries' | 'desinformation' | 'harcelement' | 'autre';

/**
 * Widget "Partager" -- contrairement au partage depuis le BottomSheet
 * (voir NewsActionsBar/NewsHeaderSharePointStyle, qui pointent vers
 * `/news?news=slug` car ouverts depuis des contextes sans URL dédiée),
 * cette page EST l'URL canonique de la News : le lien copié/partagé
 * pointe directement vers `/news/:slug`.
 */
export const ShareWidget: React.FC<ShareWidgetProps> = ({ news, onUpdate }) => {
  const { copied, copy } = useClipboard();
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<MotifSignalement>('spam');
  const [isReporting, setIsReporting] = useState(false);

  const shareUrl = `${window.location.origin}/news/${news.slug}`;
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  const bumpPartageCount = async () => {
    try {
      const partages = await newsService.partagerNews(news.id);
      onUpdate?.({ ...news, stats: { ...news.stats, partages } });
    } catch (error) {
      console.error('Échec de l’incrément du compteur de partages :', error);
    }
  };

  const handleCopy = async () => {
    const success = await copy(shareUrl);
    if (success) {
      toast('success', 'Lien copié !', 'Le lien de la news a été copié dans votre presse-papier.');
      bumpPartageCount();
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: news.titre, text: news.description, url: shareUrl });
      bumpPartageCount();
    } catch {
      // Annulation par l'utilisateur ou API indisponible -- silencieux.
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsReporting(true);
    try {
      await adminService.creerSignalement({
        typeContenu: 'news',
        contenuId: news.id,
        titreOuApercu: news.titre,
        motif: reportReason,
      });
      setIsReportOpen(false);
      toast('info', 'Signalement transmis', 'Merci d’aider à préserver un espace d’information sain.');
    } catch (error) {
      toast('error', 'Échec de l’envoi', 'Le signalement n’a pas pu être transmis. Réessayez.');
    } finally {
      setIsReporting(false);
    }
  };

  const socialLinks = [
    {
      label: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: 'X (Twitter)',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(news.titre)}`,
    },
    {
      label: 'LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(`${news.titre} — ${shareUrl}`)}`,
    },
    {
      label: 'E-mail',
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(news.titre)}&body=${encodeURIComponent(shareUrl)}`,
    },
  ];

  return (
    <SidebarWidgetCard title="Partager cette publication" icon={<Share2 className="w-4 h-4" />}>
      <div className="flex flex-wrap gap-2">
        {socialLinks.map(({ label, icon: Icon, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={label}
            aria-label={`Partager sur ${label}`}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-[#5B4DFF] hover:text-white transition-colors"
          >
            <Icon className="w-4 h-4" />
          </a>
        ))}

        <button
          type="button"
          onClick={() => setIsQrOpen(true)}
          title="QR Code"
          aria-label="Générer un QR Code"
          className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-[#5B4DFF] hover:text-white transition-colors"
        >
          <QrCode className="w-4 h-4" />
        </button>

        {canNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            title="Partager..."
            aria-label="Partager via le menu natif"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-[#5B4DFF] hover:text-white transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="mt-3 w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:border-[#5B4DFF]/50 transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-500 shrink-0" /> : <Link2 className="w-4 h-4 text-[#5B4DFF] shrink-0" />}
        <span className="truncate">{copied ? 'Lien copié !' : shareUrl.replace(/^https?:\/\//, '')}</span>
      </button>

      <button
        type="button"
        onClick={() => setIsReportOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
      >
        <Flag className="w-3.5 h-3.5" />
        Signaler cette publication
      </button>

      {/* QR Modal */}
      <Modal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} title="QR Code de la news">
        <div className="flex flex-col items-center justify-center p-3 text-center">
          <LienQrCode url={shareUrl} title={news.titre} />
          <p className="text-xs text-gray-500 mt-2">Scannez pour ouvrir directement cette publication.</p>
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
            onChange={(e) => setReportReason(e.target.value as MotifSignalement)}
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
          >
            <option value="spam">Spam ou publicité non sollicitée</option>
            <option value="propos_inappropries">Propos inappropriés ou haineux</option>
            <option value="desinformation">Désinformation ou fausse nouvelle</option>
            <option value="harcelement">Harcèlement ciblé</option>
            <option value="autre">Autre</option>
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
              disabled={isReporting}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-60"
            >
              {isReporting ? 'Envoi…' : 'Envoyer le signalement'}
            </button>
          </div>
        </form>
      </Modal>
    </SidebarWidgetCard>
  );
};
