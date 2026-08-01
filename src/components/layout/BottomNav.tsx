import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Layers, Bell } from 'lucide-react';
import { useNotificationsStore } from '../../store/notifications.store';

export const BottomNav: React.FC = () => {
  const { unreadCount } = useNotificationsStore();

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Navigation principale mobile"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#1A1F4D]/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 px-6 py-2 flex items-center justify-between shadow-lg"
    >
      {/* Côté gauche : News */}
      <NavLink
        to="/news"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center w-20 py-1 rounded-xl transition-all ${
            isActive
              ? 'text-[#5B4DFF] dark:text-purple-400 font-extrabold scale-105'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`
        }
      >
        <Layers className="w-5 h-5" />
        <span className="text-[11px] mt-1 font-semibold">News</span>
      </NavLink>

      {/* Centre : Accueil (Plus grand volume) */}
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center -mt-6 transition-transform active:scale-95 ${
            isActive ? 'scale-105' : ''
          }`
        }
      >
        {({ isActive }: { isActive: boolean }) => (
          <>
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#5B4DFF] via-[#4A3AFF] to-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/35 border-4 border-[#F7F8FC] dark:border-[#0E1338]">
              <Home className="w-7 h-7 stroke-[2.2]" />
            </div>
            <span
              className={`text-[11px] mt-0.5 font-extrabold tracking-wide ${
                isActive ? 'text-[#5B4DFF] dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              Accueil
            </span>
          </>
        )}
      </NavLink>

      {/* Côté droit : Notifications */}
      <NavLink
        to="/notifications"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center w-20 py-1 rounded-xl transition-all relative ${
            isActive
              ? 'text-[#5B4DFF] dark:text-purple-400 font-extrabold scale-105'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`
        }
      >
        <div className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span className="text-[11px] mt-1 font-semibold">Alertes</span>
      </NavLink>
    </nav>
  );
};
