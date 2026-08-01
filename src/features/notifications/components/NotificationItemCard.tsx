import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { NotificationItem, NotificationAction } from '../../../types/global.types';
import {
  MessageSquare,
  Plus,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  UserPlus,
  Send,
  Calendar,
  Check,
} from 'lucide-react';
import { toast } from '../../../hooks/useToast';
import { formatDateRelative } from '../../../lib/formatDate';

interface NotificationItemCardProps {
  item: NotificationItem;
  onMarkAsRead: (id: string) => void;
}

export const NotificationItemCard: React.FC<NotificationItemCardProps> = ({
  item,
  onMarkAsRead,
}) => {
  const [isNoticeDismissed, setIsNoticeDismissed] = useState(false);
  const [actionDone, setActionDone] = useState<string | null>(null);

  const handleActionClick = (e: React.MouseEvent, action: NotificationAction) => {
    e.stopPropagation();
    onMarkAsRead(item.id);
    setActionDone(action.actionKey);

    if (action.actionKey === 'approve') {
      toast('success', 'Proposition approuvée avec succès !', 'L\'action a été enregistrée au registre civique.');
    } else if (action.actionKey === 'reply') {
      toast('info', 'Ouverture du fil de réponse...', 'Vous allez être redirigé vers le champ de réponse.');
    } else if (action.actionKey === 'assign') {
      toast('success', 'Modérateur assigné au dossier.', 'Un e-mail de notification a été envoyé.');
    } else if (action.actionKey === 'handoff') {
      toast('info', 'Demande de remise transmise.');
    } else if (action.actionKey === 'join') {
      toast('success', 'Vous avez rejoint le département avec succès !');
    } else if (action.actionKey === 'invite_meeting') {
      toast('info', 'Invitation à la réunion civique envoyée.');
    } else {
      toast('info', `Action exécutée : ${action.label}`);
    }
  };

  // Render badge overlay icon on avatar
  const renderBadgeIcon = () => {
    switch (item.badgeType) {
      case 'comment':
      case 'mention':
        return (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#0078d4] text-white flex items-center justify-center text-[9px] shadow-sm border border-white dark:border-[#1A1F4D]">
            <MessageSquare className="w-2.5 h-2.5 fill-current" />
          </div>
        );
      case 'goal':
        return (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-white flex items-center justify-center text-[9px] shadow-sm border border-white dark:border-[#1A1F4D]">
            <Plus className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        );
      case 'rejected':
        return (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] shadow-sm border border-white dark:border-[#1A1F4D]">
            <X className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        );
      case 'invite':
        return (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gray-900 text-white flex items-center justify-center text-[9px] shadow-sm border border-white dark:border-[#1A1F4D]">
            <Plus className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        );
      case 'push':
      case 'review':
        return (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] shadow-sm border border-white dark:border-[#1A1F4D]">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>
        );
      default:
        return (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#5B4DFF] text-white flex items-center justify-center text-[9px] shadow-sm border border-white dark:border-[#1A1F4D]">
            <MessageSquare className="w-2.5 h-2.5 fill-current" />
          </div>
        );
    }
  };

  // Button styling mapping matching exact screenshot styles
  const getButtonClass = (variant?: string) => {
    switch (variant) {
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold border border-emerald-600';
      case 'primary':
        return 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold hover:opacity-90';
      case 'secondary':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800 font-bold hover:bg-emerald-100';
      case 'purple':
        return 'bg-purple-50 dark:bg-purple-950/60 text-[#5B4DFF] dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold hover:bg-purple-100';
      case 'blue':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-bold hover:bg-blue-100';
      case 'pink':
        return 'bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800 font-bold hover:bg-pink-100';
      case 'danger':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-bold hover:bg-rose-100';
      case 'outline':
      default:
        return 'bg-white dark:bg-[#121638] text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:border-gray-400 font-semibold';
    }
  };

  return (
    <div
      onClick={() => onMarkAsRead(item.id)}
      className={`relative py-3 px-1 sm:px-2 rounded-xl transition-all duration-150 border-b border-gray-100/70 dark:border-gray-800/60 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] ${
        !item.lu ? 'font-medium' : 'opacity-90'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Unread indicator blue dot */}
        <div className="pt-1.5 shrink-0 w-3 flex justify-center">
          {!item.lu ? (
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 shadow-sm shadow-blue-500/50 block animate-pulse" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-transparent block" />
          )}
        </div>

        {/* User Avatar with Badge Overlay */}
        <div className="relative shrink-0">
          <img
            src={
              item.auteur?.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
            }
            alt={item.auteur?.nom || 'Auteur'}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700"
          />
          {renderBadgeIcon()}
        </div>

        {/* Main Body */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Header text with author name & action statement */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
            <p className="text-xs sm:text-[13px] text-gray-800 dark:text-gray-200 leading-snug">
              <span className="font-extrabold text-gray-900 dark:text-white mr-1.5 font-display">
                {item.auteur?.nom || 'Anonyme'}
              </span>
              <span>{item.contenu}</span>
            </p>

            {/* Time / Worked Duration label on top right */}
            {item.workedTime && (
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 shrink-0">
                {item.workedTime}
              </span>
            )}
          </div>

          {/* Tag Pill & Timestamp Row */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {item.tag && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100/80 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 tracking-wider">
                {item.tag}
              </span>
            )}

            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {formatDateRelative(item.createdAt)}
            </span>
          </div>

          {/* Optional Warning / Notice alert banner (Exact match Image 2 top item) */}
          {item.notice && !isNoticeDismissed && (
            <div className="my-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-200">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-[11px] font-semibold truncate">{item.notice}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toast('success', 'Approuvé avec succès');
                    setIsNoticeDismissed(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-sm"
                >
                  Approuver
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNoticeDismissed(true);
                  }}
                  className="px-2 py-1 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 text-gray-700 dark:text-gray-300 text-[10px] font-bold"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons Row */}
          {item.actions && item.actions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {item.actions.map((act, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleActionClick(e, act)}
                  className={`px-3 py-1 rounded-lg text-[11px] transition-all shadow-2xs ${getButtonClass(
                    act.variant
                  )} ${actionDone === act.actionKey ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {actionDone === act.actionKey ? '✓ Effectué' : act.label}
                </button>
              ))}

              <Link
                to={item.lien}
                onClick={(e) => e.stopPropagation()}
                className="ml-auto text-[11px] font-bold text-[#5B4DFF] dark:text-purple-300 hover:underline inline-flex items-center gap-1"
              >
                Voir le sujet <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
