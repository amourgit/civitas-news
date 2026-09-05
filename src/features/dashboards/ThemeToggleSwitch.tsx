import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useUiStore } from '../../store/ui.store';

/**
 * Interrupteur clair/sombre (soleil <-> lune) — branché sur le même
 * store que le reste de l'app (useUiStore : voir ProfileDropdown.tsx
 * pour l'équivalent en entrée de menu). Utilisé dans les topbars des
 * deux dashboards refondus (Admin + Statistiques) là où la maquette de
 * référence place un interrupteur visible en permanence, plutôt que
 * dans un sous-menu.
 */
export function ThemeToggleSwitch() {
  const { theme, toggleTheme } = useUiStore();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Passer en thème clair' : 'Passer en thème sombre'}
      title={isDark ? 'Thème sombre actif' : 'Thème clair actif'}
      className="relative w-14 h-7 rounded-full shrink-0 bg-gray-200 dark:bg-white/10 border border-gray-300/60 dark:border-white/10 transition-colors"
    >
      <Sun className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500" />
      <Moon className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-300" />
      <span
        className={`absolute top-0.5 w-6 h-6 rounded-full bg-white dark:bg-[#1A1F4D] shadow-md transition-transform duration-300 flex items-center justify-center ${
          isDark ? 'translate-x-[29px]' : 'translate-x-0.5'
        }`}
      >
        {isDark ? <Moon className="w-3.5 h-3.5 text-indigo-300" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
      </span>
    </button>
  );
}
