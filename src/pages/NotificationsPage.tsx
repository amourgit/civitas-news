import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationsStore } from '../store/notifications.store';
import {
  Bell,
  CheckCheck,
  Search,
  X,
  Filter,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { NotificationDatePicker } from '../features/notifications/components/NotificationDatePicker';
import { NotificationItemCard } from '../features/notifications/components/NotificationItemCard';
import { toast } from '../hooks/useToast';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationsStore();

  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'comments' | 'review' | 'ready'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [visibleCount, setVisibleCount] = useState(8);

  // Category Tabs Configuration
  const tabs = [
    { id: 'all', label: 'Toutes' },
    { id: 'direct', label: 'Direct' },
    { id: 'comments', label: 'Commentaires' },
    { id: 'review', label: 'Soumis pour examen' },
    { id: 'ready', label: 'Prêt pour Consultation' },
  ];

  // Filtering Logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // 1. Tab filter
      if (activeTab !== 'all') {
        if (notif.categoryTab && notif.categoryTab !== activeTab) {
          return false;
        }
        if (!notif.categoryTab) {
          if (activeTab === 'comments' && notif.type !== 'commentaire') return false;
          if (activeTab === 'direct' && notif.type !== 'mention' && notif.type !== 'invitation') return false;
          if (activeTab === 'review' && notif.type !== 'review') return false;
        }
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const contentMatch = notif.contenu.toLowerCase().includes(query);
        const authorMatch = notif.auteur?.nom.toLowerCase().includes(query);
        const tagMatch = notif.tag?.toLowerCase().includes(query);
        if (!contentMatch && !authorMatch && !tagMatch) {
          return false;
        }
      }

      // 3. Date filter
      if (selectedDate) {
        const notifDate = new Date(notif.createdAt);
        const isSameDay =
          notifDate.getDate() === selectedDate.getDate() &&
          notifDate.getMonth() === selectedDate.getMonth() &&
          notifDate.getFullYear() === selectedDate.getFullYear();
        if (!isSameDay) return false;
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery, selectedDate]);

  // Group notifications into Today, Yesterday, and Older
  const groupedNotifications = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const todayList: typeof filteredNotifications = [];
    const yesterdayList: typeof filteredNotifications = [];
    const olderList: typeof filteredNotifications = [];

    filteredNotifications.slice(0, visibleCount).forEach((item) => {
      const itemTime = new Date(item.createdAt).getTime();
      const diffDays = (now - itemTime) / oneDayMs;

      if (diffDays < 1) {
        todayList.push(item);
      } else if (diffDays < 2) {
        yesterdayList.push(item);
      } else {
        olderList.push(item);
      }
    });

    return { todayList, yesterdayList, olderList };
  }, [filteredNotifications, visibleCount]);

  const handleMarkAllRead = () => {
    markAllAsRead();
    toast('success', 'Toutes les notifications ont été marquées comme lues.');
  };

  const handleClearFilters = () => {
    setActiveTab('all');
    setSearchQuery('');
    setSelectedDate(null);
  };

  const hasActiveFilters = activeTab !== 'all' || searchQuery !== '' || selectedDate !== null;

  return (
    <div className="max-w-4xl mx-auto px-0 sm:px-4 py-1 sm:py-4 space-y-3 pb-20">
      {/* Sticky Compact Top Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#0A0D28]/95 backdrop-blur-md px-2 sm:px-0 py-2.5 border-b border-gray-100 dark:border-gray-800/80 transition-all">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#5B4DFF]/10 dark:bg-[#5B4DFF]/20 text-[#5B4DFF] dark:text-purple-300 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white font-display tracking-tight flex items-center gap-1.5">
              Notifications
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-red-500 text-white">
                  {unreadCount}
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-[#5B4DFF] dark:text-purple-300 text-[11px] font-bold border border-purple-200/80 dark:border-purple-800 transition-all"
              >
                <CheckCheck className="w-3 h-3" />
                <span className="hidden sm:inline">Tout marquer comme lu</span>
                <span className="sm:hidden">Tout lire</span>
              </button>
            )}

            <button
              onClick={() => navigate(-1)}
              className="p-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 border border-rose-200/80 dark:border-rose-800 transition-all"
              title="Fermer"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section Below Sticky Header */}
      <div className="px-2 sm:px-0 space-y-3 pt-1">
        {/* Filter Controls Row: Category Tabs + Date Picker */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Horizontal Scrollable Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all text-xs shrink-0 ${
                    isActive
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                      : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Date Picker Button */}
          <div className="shrink-0 flex items-center gap-2">
            <NotificationDatePicker
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
            />
          </div>
        </div>

        {/* Search Bar Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par utilisateur, tag (ex: TN38, FA-1) ou mot-clé..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-[#121638] text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 border border-gray-200/80 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Active Filters Bar reset option */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs text-gray-500 pt-0.5">
            <span>
              Résultats de recherche :{' '}
              <strong className="text-gray-900 dark:text-white">{filteredNotifications.length}</strong> notification(s)
            </span>
            <button
              onClick={handleClearFilters}
              className="text-[#5B4DFF] hover:underline font-bold flex items-center gap-1 text-[11px]"
            >
              <RefreshCw className="w-3 h-3" /> Effacer les filtres
            </button>
          </div>
        )}
      </div>

      {/* Notifications List Grouped by Time Period */}
      {filteredNotifications.length === 0 ? (
        <div className="p-8 text-center bg-transparent rounded-3xl space-y-3">
          <SlidersHorizontal className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300 font-display">
            Aucune notification ne correspond à vos critères
          </p>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            Essayez de modifier votre recherche ou d'effacer les filtres actifs.
          </p>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 rounded-xl bg-[#5B4DFF] text-white text-xs font-bold hover:bg-[#5B4DFF]/90 transition-all shadow-md"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="space-y-6 px-2 sm:px-0">
          {/* TODAY (AUJOURD'HUI) */}
          {groupedNotifications.todayList.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 px-1">
                <span className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest font-display">
                  AUJOURD'HUI
                </span>
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
              </div>
              <div className="space-y-2.5">
                {groupedNotifications.todayList.map((item) => (
                  <NotificationItemCard key={item.id} item={item} onMarkAsRead={markAsRead} />
                ))}
              </div>
            </div>
          )}

          {/* YESTERDAY (HIER) */}
          {groupedNotifications.yesterdayList.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 px-1">
                <span className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest font-display">
                  HIER
                </span>
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
              </div>
              <div className="space-y-2.5">
                {groupedNotifications.yesterdayList.map((item) => (
                  <NotificationItemCard key={item.id} item={item} onMarkAsRead={markAsRead} />
                ))}
              </div>
            </div>
          )}

          {/* OLDER (PLUS ANCIENS) */}
          {groupedNotifications.olderList.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 px-1">
                <span className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest font-display">
                  PLUS ANCIENS
                </span>
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
              </div>
              <div className="space-y-2.5">
                {groupedNotifications.olderList.map((item) => (
                  <NotificationItemCard key={item.id} item={item} onMarkAsRead={markAsRead} />
                ))}
              </div>
            </div>
          )}

          {/* Load More / Bottom Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            {filteredNotifications.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((prev) => prev + 5)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white dark:bg-[#1A1F4D] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-extrabold border border-gray-200 dark:border-gray-700 shadow-sm transition-all"
              >
                Voir les notifications précédentes ({filteredNotifications.length - visibleCount} restantes)
              </button>
            )}

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#5B4DFF] text-white text-xs font-extrabold hover:bg-[#5B4DFF]/90 shadow-md transition-all ml-auto"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
