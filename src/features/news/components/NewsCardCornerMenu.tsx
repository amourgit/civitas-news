'use client';

import React, { useState, useRef, useEffect, useId, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, LayoutGroup } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import useMeasure from 'react-use-measure';
import {
  Share08Icon,
  QrCode01Icon,
  Flag01Icon,
  PencilEdit01Icon,
  SentIcon,
  Archive01Icon,
  Delete02Icon,
  MoreHorizontalCircle01Icon,
} from '@hugeicons/core-free-icons';
import { News } from '../../../types/global.types';
import { Modal } from '../../../components/ui/Modal';
import { LienQrCode } from '../../liens/components/LienQrCode';
import { toast, toastConfirm } from '../../../hooks/useToast';
import { useClipboard } from '../../../hooks/useClipboard';
import { newsService } from '../../../services/api/news.service';
import { adminService } from '../../../services/api/admin.service';
import { useAuthStore } from '../../../store/auth.store';
import { usePermissions } from '../../../lib/permissions/usePermissions';
import { PERMISSIONS } from '../../../lib/permissions/permissions.catalog';

const easeOutQuint: [number, number, number, number] = [0.23, 1, 0.32, 1];

type MotifSignalement = 'spam' | 'propos_inappropries' | 'desinformation' | 'harcelement' | 'autre';

interface MenuAction {
  id: string;
  label: string;
  icon: typeof Share08Icon;
  onClick: () => void;
  danger?: boolean;
}
interface MenuDivider {
  id: string;
  divider: true;
}
type MenuEntry = MenuAction | MenuDivider;

export interface NewsCardCornerMenuProps {
  news: News;
  onUpdate?: (updated: News) => void;
  /** Appelé après une suppression réussie -- permet à un parent (grille,
   * liste "mes publications"...) de retirer la News de sa propre liste.
   * En son absence, le composant masque simplement la card localement
   * (voir NewsCard.tsx: `isRemoved`). */
  onDelete?: (newsId: string) => void;
}

/**
 * Menu contextuel flottant -- coin haut-droit de la news card.
 * Structure/animation inchangées (accordéon spring + stagger, voir la
 * source "TwentyTwelveOne") ; seul le CONTENU devient réel et
 * dynamique :
 *
 *  - Actions UNIVERSELLES (visibles pour tout le monde, AUCUNE
 *    vérification de propriété -- on ne teste jamais `auteur.id ===
 *    user.id` pour celles-ci, exactement comme le fait le backend, voir
 *    NewsPermission.has_object_permission : `reagir`/`partager` sont
 *    ouverts à N'IMPORTE QUEL utilisateur sur N'IMPORTE QUELLE News) :
 *    Partager, QR Code, Signaler.
 *  - Actions PROTÉGÉES, ajoutées au tableau UNIQUEMENT si l'utilisateur
 *    courant remplit la permission requise (voir usePermissions()) :
 *    Modifier / Publier-Archiver / Supprimer -- reflet exact côté
 *    frontend de NewsPermission côté backend (propriétaire de la News
 *    OU modérateur/administrateur), qui refait de toute façon la même
 *    vérification en profondeur : ce menu ne fait qu'éviter d'afficher
 *    un bouton qui échouerait de toute façon en 403.
 */
export function NewsCardCornerMenu({ news, onUpdate, onDelete }: NewsCardCornerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<MotifSignalement>('spam');
  const [isReporting, setIsReporting] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scopeId = useId();
  const navigate = useNavigate();
  const { copy } = useClipboard();
  const { isAuthenticated } = useAuthStore();
  const { canOnResource, can } = usePermissions();

  const [contentRef, contentBounds] = useMeasure();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleShareCopy = async () => {
    const shareUrl = `${window.location.origin}/news?news=${news.slug}`;
    const success = await copy(shareUrl);
    if (success) {
      toast('success', 'Lien copié !', 'Le lien de la news a été copié dans votre presse-papier.');
    }
    try {
      const partages = await newsService.partagerNews(news.id);
      onUpdate?.({ ...news, stats: { ...news.stats, partages } });
    } catch (error) {
      // Le lien est déjà copié : on ne bloque pas l'expérience si seul le
      // compteur de partages échoue (ex: visiteur non authentifié -- voir
      // NewsPermission.has_permission, `partager` requiert un compte).
      console.error('Échec de l’incrément du compteur de partages :', error);
    }
  };

  const handleOpenReport = () => {
    if (!isAuthenticated) {
      toast('info', 'Connexion requise', 'Connectez-vous pour signaler cette publication.');
      return;
    }
    setIsReportOpen(true);
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
    } catch {
      toast('error', 'Échec de l’envoi', 'Le signalement n’a pas pu être transmis. Réessayez.');
    } finally {
      setIsReporting(false);
    }
  };

  const handleToggleStatut = async () => {
    const nouveauStatut = news.statut === 'publie' ? 'archive' : 'publie';
    try {
      const updated = await newsService.updateNews(news.id, { statut: nouveauStatut });
      onUpdate?.(updated);
      toast(
        'success',
        nouveauStatut === 'publie' ? 'Publication republiée' : 'Publication archivée',
      );
    } catch {
      toast('error', 'Échec de l’opération', 'Le statut n’a pas pu être mis à jour. Réessayez.');
    }
  };

  const handleDelete = () => {
    toastConfirm(
      'Supprimer cette publication ?',
      async () => {
        try {
          await newsService.deleteNews(news.id);
          toast('success', 'Publication supprimée');
          setIsRemoved(true);
          onDelete?.(news.id);
        } catch {
          toast('error', 'Échec de la suppression', 'Réessayez dans quelques instants.');
        }
      },
      {
        message: 'Cette action est irréversible.',
        confirmLabel: 'Supprimer',
        confirmVariant: 'danger',
      }
    );
  };

  const ownerId = news.auteur?.id;
  const peutModifier = canOnResource('news:edit', ownerId);
  const peutSupprimer = canOnResource('news:delete', ownerId);
  const peutChangerStatut = peutModifier || can(PERMISSIONS.NEWS_PUBLISH);

  const menuItems: MenuEntry[] = useMemo(() => {
    // Actions universelles -- aucune vérification de propriété, cohérent
    // avec le backend (voir NewsPermission.has_object_permission).
    const items: MenuEntry[] = [
      { id: 'partager', label: 'Partager le lien', icon: Share08Icon, onClick: handleShareCopy },
      { id: 'qrcode', label: 'QR Code', icon: QrCode01Icon, onClick: () => setIsQrOpen(true) },
      { id: 'signaler', label: 'Signaler', icon: Flag01Icon, onClick: handleOpenReport },
    ];

    const actionsProtegees: MenuAction[] = [];
    if (peutModifier) {
      actionsProtegees.push({
        id: 'modifier',
        label: 'Modifier',
        icon: PencilEdit01Icon,
        onClick: () => navigate(`/news/modifier/${news.id}`),
      });
    }
    if (peutChangerStatut) {
      actionsProtegees.push(
        news.statut === 'publie'
          ? { id: 'archiver', label: 'Archiver', icon: Archive01Icon, onClick: handleToggleStatut }
          : { id: 'publier', label: 'Publier', icon: SentIcon, onClick: handleToggleStatut }
      );
    }
    if (peutSupprimer) {
      actionsProtegees.push({
        id: 'supprimer',
        label: 'Supprimer',
        icon: Delete02Icon,
        onClick: handleDelete,
        danger: true,
      });
    }

    if (actionsProtegees.length > 0) {
      items.push({ id: 'divider-permissions', divider: true }, ...actionsProtegees);
    }
    return items;
    // `news` (référence complète, pas seulement ses champs id/slug/statut)
    // est volontairement dans les dépendances : les handlers ci-dessus
    // capturent `news` par closure (ex: handleShareCopy s'en sert pour
    // construire `onUpdate?.({ ...news, ... })`) -- ne dépendre que de
    // quelques champs primitifs figerait ces closures sur un `news`
    // périmé dès qu'un parent repasse un objet mis à jour (nouvelle
    // réaction, nouveau compteur de vues...) sans que id/slug/statut ne
    // changent eux-mêmes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [news, ownerId, peutModifier, peutSupprimer, peutChangerStatut, isAuthenticated]);

  if (isRemoved) return null;

  const openHeight = Math.max(40, Math.ceil(contentBounds.height));
  return (
    <LayoutGroup id={scopeId}>
      <div ref={containerRef} className="relative h-10 w-10 not-prose">
        <motion.div
          layout
          initial={false}
          animate={{
            width: isOpen ? 220 : 40,
            height: isOpen ? openHeight : 40,
            borderRadius: isOpen ? 14 : 12,
          }}
          transition={{ type: 'spring' as const, damping: 34, stiffness: 380, mass: 0.8 }}
          className="absolute top-0 right-0 bg-white/10 backdrop-blur-2xl border border-white/25 shadow-xl shadow-black/20 overflow-hidden cursor-pointer origin-top-right"
          onClick={() => !isOpen && setIsOpen(true)}
        >
          <motion.div
            initial={false}
            animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 0.8 : 1 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ pointerEvents: isOpen ? 'none' : 'auto', willChange: 'transform' }}
          >
            <HugeiconsIcon icon={MoreHorizontalCircle01Icon} className="w-5 h-5 text-white" />
          </motion.div>

          {/* Menu Content - visible when open */}
          <div ref={contentRef}>
            <motion.div
              layout
              initial={false}
              animate={{ opacity: isOpen ? 1 : 0 }}
              transition={{ duration: 0.2, delay: isOpen ? 0.08 : 0 }}
              className="p-2"
              style={{ pointerEvents: isOpen ? 'auto' : 'none', willChange: 'transform' }}
            >
              <ul className="flex flex-col gap-0.5 m-0! p-0! list-none!">
                {menuItems.map((item, index) => {
                  if ('divider' in item) {
                    return (
                      <motion.hr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isOpen ? 1 : 0 }}
                        transition={{ delay: isOpen ? 0.12 + index * 0.015 : 0 }}
                        className="border-white/20 my-1.5!"
                      />
                    );
                  }

                  const isDanger = !!item.danger;
                  const showIndicator = hoveredItem === item.id;
                  const itemDelay = isOpen ? 0.06 + index * 0.02 : 0;

                  return (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: isOpen ? 1 : 0, x: isOpen ? 0 : 8 }}
                      transition={{ delay: itemDelay, duration: 0.15, ease: easeOutQuint }}
                      onClick={() => {
                        setIsOpen(false);
                        item.onClick();
                      }}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`relative flex items-center gap-3 rounded-lg text-sm cursor-pointer transition-colors duration-200 ease-out m-0! pl-3! py-2! ${
                        isDanger ? 'text-white/70 hover:text-red-300' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {showIndicator && (
                        <motion.div
                          layoutId="activeIndicator"
                          className={`absolute inset-0 rounded-lg ${isDanger ? 'bg-red-500/20' : 'bg-white/15'}`}
                          transition={{ type: 'spring', damping: 30, stiffness: 520, mass: 0.8 }}
                        />
                      )}
                      {showIndicator && (
                        <motion.div
                          layoutId="leftBar"
                          className={`absolute left-0 top-0 bottom-0 my-auto w-[3px] h-5 rounded-full ${
                            isDanger ? 'bg-red-400' : 'bg-white'
                          }`}
                          transition={{ type: 'spring', damping: 30, stiffness: 520, mass: 0.8 }}
                        />
                      )}
                      <HugeiconsIcon icon={item.icon} className="w-[18px] h-[18px] relative z-10" />
                      <span className="font-medium relative z-10 whitespace-nowrap">{item.label}</span>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* QR Code */}
      <Modal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} title="QR Code & Diffusion">
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <LienQrCode url={`${window.location.origin}/news?news=${news.slug}`} title={news.titre} />
          <p className="text-xs text-gray-500 mt-4 max-w-xs">
            Scannez ce QR Code pour accéder directement à cette publication.
          </p>
        </div>
      </Modal>

      {/* Signalement -- ouvert à tout utilisateur authentifié, sans
          vérification de propriété (voir SignalementPermission côté
          backend : seule la CRÉATION requiert un compte, aucune notion
          d'auteur de la News signalée). */}
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
    </LayoutGroup>
  );
}

export default NewsCardCornerMenu;
