import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { News, Sujet, TypeReaction } from '../../../types/global.types';
import { useNewsReactions } from '../hooks/useNewsReactions';
import { RichTextViewer } from '../../../components/ui/RichTextViewer';
import {
  Plus,
  Share2,
  MessageSquarePlus,
  Settings,
  BarChart2,
  Maximize2,
  MapPin,
  Calendar,
  Building2,
  Hexagon,
  Smile,
  QrCode,
  Flag,
  Check,
  Clock,
  User,
} from 'lucide-react';
import { formatDateFull } from '../../../lib/formatDate';
import { toast } from '../../../hooks/useToast';
import { useClipboard } from '../../../hooks/useClipboard';
import { Modal } from '../../../components/ui/Modal';
import { LienQrCode } from '../../liens/components/LienQrCode';
import { Avatar } from '../../../components/ui/Avatar';

export interface NewsHeaderSharePointStyleProps {
  news?: News;
  sujet?: News;
  onUpdate?: (updated: News) => void;
  onScrollToComments?: () => void;
  onScrollToPolls?: () => void;
}

const EMOJI_MAP: Record<TypeReaction, { emoji: string; label: string }> = {
  coeur: { emoji: '❤️', label: 'J’adore' },
  jaime: { emoji: '👍', label: 'J’aime' },
  bravo: { emoji: '👏', label: 'Bravo' },
  youpi: { emoji: '🎉', label: 'Génial' },
  wow: { emoji: '😮', label: 'Impressionnant' },
  jaimepas: { emoji: '👎', label: 'Pas d’accord' },
};

export const NewsHeaderSharePointStyle: React.FC<NewsHeaderSharePointStyleProps> = ({
  news,
  sujet,
  onUpdate,
  onScrollToComments,
  onScrollToPolls,
}) => {
  const currentItem = news || sujet;
  if (!currentItem) return null;

  const { react } = useNewsReactions(currentItem.id, onUpdate);
  const { copy } = useClipboard();
  const [showReactions, setShowReactions] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('spam');

  const handleShareCopy = async () => {
    // Construit le lien directement depuis le slug plutôt que
    // window.location.href : voir NewsActionsBar.tsx pour le raisonnement
    // complet (faux si ouvert hors de /news, via le BottomSheet global).
    const shareUrl = `${window.location.origin}/news?news=${currentItem.slug}`;
    const success = await copy(shareUrl);
    if (success) {
      toast('success', 'Lien copié !', 'Le lien de la news a été copié dans votre presse-papier.');
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsReportOpen(false);
    toast('info', 'Signalement transmis', 'Merci d’aider à préserver un espace d’information sain.');
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <div className="w-full rounded-none overflow-hidden shadow-sm border border-emerald-900/10 mb-2 bg-white dark:bg-[#101538] text-xs">
      {/* 1. Sub-navigation Category Bar (Dark Purple) */}
      <div className="bg-[#3b2d91] text-white px-1 sm:px-2 py-0.5 flex items-center gap-1.5 sm:gap-3 overflow-x-auto no-scrollbar text-[11px]">
        <span className="font-semibold px-1.5 py-0.5 rounded-none bg-white/20 whitespace-nowrap">
          {currentItem.categorie.nom}
        </span>
        <Link to="/news" className="hover:underline opacity-90 hover:opacity-100 whitespace-nowrap">
          Toutes les News
        </Link>
        <Link to="/statistiques" className="hover:underline opacity-90 hover:opacity-100 whitespace-nowrap">
          Sondages & Statistiques
        </Link>
        {currentItem.province && (
          <span className="opacity-90 whitespace-nowrap flex items-center gap-1">
            <MapPin className="w-3 h-3 text-purple-300" />
            {currentItem.province}
          </span>
        )}
        <span className="ml-auto opacity-75 hidden sm:inline whitespace-nowrap">
          Espace Citoyen
        </span>
      </div>

      {/* 2. Main News Title Header Banner (Purple) */}
      <div className="bg-[#5B4DFF] text-white px-1.5 sm:px-3 py-1.5 sm:py-2 flex flex-wrap items-center justify-between gap-1.5">
        {/* Left: Hexagon Logo & Title */}
        <div className="flex items-center gap-1.5 max-w-2xl">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-none bg-purple-800 border border-purple-400/40 flex items-center justify-center shrink-0 shadow-sm text-white font-extrabold text-xs sm:text-sm">
            <Hexagon className="w-4 h-4 text-purple-200 fill-purple-600/30" />
          </div>
          <div>
            <div className="flex items-center gap-1 text-[10px] text-purple-200 uppercase tracking-wider font-semibold leading-none mb-0.5">
              <span>NEWS #{currentItem.id.slice(-4).toUpperCase()}</span>
              <span>•</span>
              <span className="capitalize">{currentItem.type}</span>
            </div>
            <h1 className="text-xs sm:text-base font-bold text-white tracking-tight leading-snug font-display">
              {currentItem.titre}
            </h1>
          </div>
        </div>

        {/* Right: Quick Action Links */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 text-xs text-white">
          <button
            onClick={handleShareCopy}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-none hover:bg-white/15 transition-colors font-medium cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Partager</span>
          </button>
        </div>
      </div>

      {/* 3. Action Command Toolbar (Light/White) */}
      <div className="bg-white dark:bg-[#161B40] border-b border-gray-200 dark:border-gray-800 px-1.5 sm:px-3 py-0.5 flex flex-wrap items-center justify-between gap-1 text-gray-700 dark:text-gray-200 text-[11px]">
        {/* Left Toolbar Items */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={onScrollToComments}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-none hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-100 font-medium transition-colors cursor-pointer"
          >
            <MessageSquarePlus className="w-3 h-3 text-[#5B4DFF]" />
            <span>+ Nouveau commentaire</span>
          </button>

          <button
            onClick={() => setShowDetailsModal(true)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-none hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors cursor-pointer"
          >
            <Settings className="w-3 h-3 text-gray-500" />
            <span className="hidden sm:inline">Détails de la page</span>
          </button>

          {currentItem.sondages && currentItem.sondages.length > 0 && (
            <button
              onClick={onScrollToPolls}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-none hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition-colors cursor-pointer"
            >
              <BarChart2 className="w-3 h-3 text-blue-600" />
              <span>Analyse ({currentItem.sondages.length})</span>
            </button>
          )}
        </div>

        {/* Right Toolbar Items */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-gray-500 dark:text-gray-400 font-medium flex-wrap text-[10px]">
          <span className="hidden md:inline">
            Publié {formatDateFull(currentItem.createdAt)}
          </span>

          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-none hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
            >
              <Smile className="w-3 h-3 text-amber-500" />
              <span>Réagir</span>
            </button>

            {/* Reactions Popover */}
            {showReactions && (
              <div className="absolute right-0 top-full mt-1 z-30 p-1 bg-white dark:bg-[#1e2450] rounded-none shadow-xl border border-gray-200 dark:border-gray-700 flex items-center gap-0.5 animate-in fade-in zoom-in-95">
                {(Object.keys(EMOJI_MAP) as TypeReaction[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      react(type);
                      setShowReactions(false);
                    }}
                    className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-none transition-transform hover:scale-110 ${
                      currentItem.userReaction === type ? 'bg-purple-50 dark:bg-purple-950 ring-1 ring-purple-500' : ''
                    }`}
                    title={EMOJI_MAP[type].label}
                  >
                    <span className="text-sm">{EMOJI_MAP[type].emoji}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsQrOpen(true)}
            className="p-1 rounded-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="QR Code"
          >
            <QrCode className="w-3 h-3 text-gray-600 dark:text-gray-300" />
          </button>

          <button
            onClick={() => setIsReportOpen(true)}
            className="p-1 rounded-none hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500 transition-colors"
            title="Signaler"
          >
            <Flag className="w-3 h-3" />
          </button>

          <button
            onClick={toggleFullScreen}
            className="p-1 rounded-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Plein écran"
          >
            <Maximize2 className="w-3 h-3 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* 4. Main Hero Media Visual & Context Grid */}
      <div className="relative w-full overflow-hidden bg-slate-900 text-white min-h-[250px] sm:min-h-[350px]">
        {/* Main Background Image */}
        <img
          src={currentItem.image}
          alt={currentItem.titre}
          className="w-full h-[250px] sm:h-[350px] object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

        {/* Floating Hero Content Overlay */}
        <div className="absolute inset-0 p-3 sm:p-5 flex flex-col justify-end max-w-5xl">
          <div className="text-xs sm:text-sm text-gray-200 line-clamp-2 max-w-3xl mb-2 leading-snug">
            <RichTextViewer content={currentItem.description} compact />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] text-purple-300">
            <span className="flex items-center gap-1.5 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">
              <Avatar src={currentItem.auteur.avatar} name={currentItem.auteur.nomAffiche} size="sm" className="w-4 h-4 rounded-full" />
              <span>Par {currentItem.auteur.nomAffiche}</span>
            </span>
            {currentItem.organisation && (
              <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">
                <Building2 className="w-3 h-3 text-purple-400" />
                {currentItem.organisation.nom}
              </span>
            )}
            {currentItem.etablissement && (
              <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">
                {currentItem.etablissement.nom}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 5. Bottom Teal Quick-Info Bar */}
      <div className="bg-[#5B4DFF] text-white p-2 sm:p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div className="flex items-start gap-1.5">
          <Calendar className="w-4 h-4 text-purple-200 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold leading-none">Publication</div>
            <div className="text-purple-100 opacity-90 text-[10px] mt-0.5">
              {formatDateFull(currentItem.createdAt)}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-1.5">
          <Clock className="w-4 h-4 text-purple-200 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold leading-none">Statut de la publication</div>
            <div className="text-purple-100 opacity-90 text-[10px] mt-0.5">
              {currentItem.dateFin ? `Clôture le ${formatDateFull(currentItem.dateFin)}` : 'Debat ouvert aux citoyens'}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-1.5">
          <MessageSquarePlus className="w-4 h-4 text-purple-200 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold leading-none">Participations</div>
            <div className="text-purple-100 opacity-90 text-[10px] mt-0.5">
              {currentItem.stats.commentaires} commentaires • {currentItem.stats.vues} vues
            </div>
          </div>
        </div>

        <div className="flex items-start gap-1.5">
          <MapPin className="w-4 h-4 text-purple-200 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold leading-none">Portée territoriale</div>
            <div className="text-purple-100 opacity-90 text-[10px] mt-0.5">
              {currentItem.province || 'Nationale & Interuniversitaire'}
            </div>
          </div>
        </div>
      </div>

      {/* Page Details Modal */}
      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title="Détails de la news">
        <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300">
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">Identifiant unique: </span>
            <span>{currentItem.id}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">Auteur: </span>
            <span>{currentItem.auteur.nomAffiche} ({currentItem.auteur.role})</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">Catégorie: </span>
            <span>{currentItem.categorie.nom}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">Région / Province: </span>
            <span>{currentItem.province || 'Toutes les provinces'}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">Nombre de réactions: </span>
            <span>{Object.values(currentItem.stats.reactions).reduce((a, b) => a + b, 0)}</span>
          </div>
        </div>
      </Modal>

      {/* QR Modal */}
      <Modal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} title="QR Code de la news">
        <div className="flex flex-col items-center justify-center p-3 text-center">
          <LienQrCode url={window.location.href} title={currentItem.titre} />
          <p className="text-xs text-gray-500 mt-2">
            Scannez pour ouvrir directement cette news sur mobile.
          </p>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} title="Signaler cette News">
        <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
          <p className="text-gray-600 dark:text-gray-300">
            Pour quel motif souhaitez-vous signaler cette news au comité de modération ?
          </p>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            <option value="spam">Spam ou contenu déplacé</option>
            <option value="propos_inappropries">Propos inappropriés</option>
            <option value="desinformation">Information inexacte</option>
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsReportOpen(false)}
              className="px-3 py-1.5 rounded text-gray-600"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-red-600 text-white font-bold"
            >
              Signaler
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export const SujetHeaderSharePointStyle = NewsHeaderSharePointStyle;
export type SujetHeaderSharePointStyleProps = NewsHeaderSharePointStyleProps;

