import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { NotificationItem, NotificationAction, NotificationFormat } from '../../../types/global.types';
import {
  Newspaper,
  Vote,
  Megaphone,
  AlertTriangle,
  MessageSquareText,
  FileCheck,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Tag,
  Check,
  Bell,
  Info,
} from 'lucide-react';
import { toast } from '../../../hooks/useToast';
import { formatDateRelative } from '../../../lib/formatDate';
import { ExpandableDescription } from '../../../components/ui/ExpandableDescription';

interface NotificationItemCardProps {
  item: NotificationItem;
  onMarkAsRead: (id: string) => void;
}

export const NotificationItemCard: React.FC<NotificationItemCardProps> = ({
  item,
  onMarkAsRead,
}) => {
  const navigate = useNavigate();
  const [isNoticeDismissed, setIsNoticeDismissed] = useState(false);
  const [actionDoneKey, setActionDoneKey] = useState<string | null>(null);

  const getFormatDetails = (format?: NotificationFormat | string) => {
    switch (format) {
      case 'sondage':
        return {
          label: 'Sondage Civique',
          icon: Vote,
          bg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
      case 'annonce':
        return {
          label: 'Annonce Officielle',
          icon: Megaphone,
          bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
      case 'alerte':
        return {
          label: 'Alerte Urgente',
          icon: AlertTriangle,
          bg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        };
      case 'consultation':
        return {
          label: 'Consultation Citoyenne',
          icon: MessageSquareText,
          bg: 'bg-purple-50 dark:bg-purple-950/50 text-[#5B4DFF] dark:text-purple-300 border-purple-200 dark:border-purple-800',
        };
      case 'reforme':
      case 'decision':
        return {
          label: 'Décret & Décision',
          icon: FileCheck,
          bg: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
        };
      case 'actualite':
      default:
        return {
          label: 'Actualité Nationale',
          icon: Newspaper,
          bg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        };
    }
  };

  const formatDetails = getFormatDetails(item.format || item.type);
  const FormatIcon = formatDetails.icon;

  const handleActionClick = (e: React.MouseEvent, action: NotificationAction) => {
    e.stopPropagation();
    e.preventDefault();

    onMarkAsRead(item.id);
    setActionDoneKey(action.actionKey);

    // Trigger Toast with appropriate type & colors
    const toastType = action.toastType || (action.variant === 'danger' ? 'error' : action.variant === 'purple' ? 'purple' : action.variant === 'success' ? 'success' : action.variant === 'warning' ? 'warning' : 'info');
    const toastTitle = action.toastTitle || `Action exécutée : ${action.label}`;
    const toastMsg = action.toastMessage || 'L\'action a été enregistrée avec succès.';

    if (toastType === 'success') {
      toast('success', toastTitle, toastMsg);
    } else if (toastType === 'warning') {
      toast('warning', toastTitle, toastMsg);
    } else if (toastType === 'purple') {
      toast('purple', toastTitle, toastMsg);
    } else if (toastType === 'error') {
      toast('error', toastTitle, toastMsg);
    } else {
      toast('info', toastTitle, toastMsg);
    }

    // If action defines a redirect URL, navigate
    if (action.url) {
      setTimeout(() => {
        navigate(action.url!);
      }, 300);
    }
  };

  const getButtonClass = (variant?: string) => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs';
      case 'primary':
        return 'bg-[#5B4DFF] hover:bg-[#4a3ecc] text-white font-bold shadow-xs';
      case 'purple':
        return 'bg-purple-100 dark:bg-purple-950/70 text-[#5B4DFF] dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold hover:bg-purple-200 dark:hover:bg-purple-900';
      case 'blue':
        return 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold hover:bg-blue-100';
      case 'danger':
        return 'bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-bold hover:bg-rose-100';
      case 'secondary':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold hover:bg-gray-200';
      case 'outline':
      default:
        return 'bg-white dark:bg-[#121638] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:border-gray-400 font-semibold';
    }
  };

  return (
    <div
      onClick={() => onMarkAsRead(item.id)}
      className={`group relative rounded-2xl p-3.5 sm:p-4 transition-all duration-200 border ${
        !item.lu
          ? 'bg-white dark:bg-[#14183E] border-[#5B4DFF]/30 dark:border-[#5B4DFF]/40 shadow-sm'
          : 'bg-gray-50/70 dark:bg-[#101332]/60 border-gray-200/70 dark:border-gray-800/80 hover:bg-white dark:hover:bg-[#14183E]'
      }`}
    >
      {/* Unread Accent Bar on Left */}
      {!item.lu && (
        <div className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full bg-[#5B4DFF]" />
      )}

      <div className="space-y-2.5 pl-1.5">
        {/* Top Metadata Header Row: Theme, Format, Urgence, Unread Badge, Date */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Format Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${formatDetails.bg}`}
            >
              <FormatIcon className="w-3 h-3 shrink-0" />
              {formatDetails.label}
            </span>

            {/* Thème Concerné (Category Badge) */}
            {item.categorie && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black border"
                style={{
                  backgroundColor: item.categorie.couleur + '18',
                  color: item.categorie.couleur,
                  borderColor: item.categorie.couleur + '35',
                }}
              >
                {item.categorie.nom}
              </span>
            )}

            {/* Tag Reference */}
            {item.tag && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                <Tag className="w-2.5 h-2.5" />
                {item.tag}
              </span>
            )}

            {/* Urgent Badge */}
            {item.urgente && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-red-500 text-white animate-pulse">
                PRIORITAIRE
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Unread Pill */}
            {!item.lu && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#5B4DFF] text-white uppercase tracking-wider shadow-xs">
                NOUVEAU
              </span>
            )}

            {/* Relative Date */}
            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDateRelative(item.createdAt)}
            </span>
          </div>
        </div>

        {/* Title */}
        <Link
          to={item.lien}
          onClick={(e) => e.stopPropagation()}
          className="block group-hover:text-[#5B4DFF] transition-colors"
        >
          <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white font-display leading-snug">
            {item.titre || item.contenu || 'Notification d’Information'}
          </h3>
        </Link>

        {/* Description */}
        <div className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          <ExpandableDescription content={item.description || item.contenu || ''} maxChars={170} />
        </div>

        {/* Optional Alert Notice Banner */}
        {item.notice && !isNoticeDismissed && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-200 my-1">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-[11px] font-semibold truncate">{item.notice}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsNoticeDismissed(true);
              }}
              className="px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-800/60 hover:bg-amber-300/60 text-amber-900 dark:text-amber-100 text-[10px] font-bold"
            >
              Masquer
            </button>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100/80 dark:border-gray-800/60">
          <div className="flex flex-wrap items-center gap-2">
            {item.actions &&
              item.actions.map((act, idx) => {
                const isDone = actionDoneKey === act.actionKey;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => handleActionClick(e, act)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] transition-all flex items-center gap-1.5 cursor-pointer ${getButtonClass(
                      act.variant
                    )} ${isDone ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    {isDone ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Effectué</span>
                      </>
                    ) : (
                      <>
                        <span>{act.label}</span>
                        {act.url && <ExternalLink className="w-3 h-3 opacity-70" />}
                      </>
                    )}
                  </button>
                );
              })}
          </div>

          <Link
            to={item.lien}
            onClick={(e) => e.stopPropagation()}
            className="ml-auto inline-flex items-center gap-1 text-[11px] font-extrabold text-[#5B4DFF] dark:text-purple-300 hover:underline pt-0.5"
          >
            <span>Consulter la publication</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
