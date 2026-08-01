import React from 'react';
import { Settings, Sun, Moon, Bell, Shield, Check } from 'lucide-react';
import { useUiStore } from '../store/ui.store';

export default function ParametresPage() {
  const { theme, setTheme } = useUiStore();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white font-display flex items-center gap-3">
        <Settings className="w-7 h-7 text-[#5B4DFF]" />
        Paramètres du Compte & de l'Application
      </h1>

      {/* Apparence & Thème */}
      <div className="bg-white dark:bg-[#1A1F4D] p-6 rounded-3xl border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              Apparence & Thème
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Choisissez le mode visuel qui vous convient (Clair ou Sombre).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
              theme === 'light'
                ? 'border-[#5B4DFF] bg-purple-50/70 dark:bg-purple-950/40 text-[#5B4DFF] dark:text-white font-bold ring-2 ring-[#5B4DFF]/30'
                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sun className="w-5 h-5 text-amber-500" />
              <div>
                <div className="text-xs font-bold">Mode Clair</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 font-normal">Idéal en plein jour</div>
              </div>
            </div>
            {theme === 'light' && <Check className="w-4 h-4 text-[#5B4DFF]" />}
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
              theme === 'dark'
                ? 'border-[#5B4DFF] bg-purple-50/70 dark:bg-purple-950/40 text-white font-bold ring-2 ring-[#5B4DFF]/30'
                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Moon className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-xs font-bold">Mode Sombre</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 font-normal">Confort pour les yeux</div>
              </div>
            </div>
            {theme === 'dark' && <Check className="w-4 h-4 text-[#5B4DFF]" />}
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-[#1A1F4D] p-6 rounded-3xl border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#5B4DFF]" />
          Préférences de Notifications
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Recevez des alertes pour les nouveaux sujets, sondages et réponses à vos commentaires.
        </p>
      </div>

      {/* Confidentialité */}
      <div className="bg-white dark:bg-[#1A1F4D] p-6 rounded-3xl border border-gray-200 dark:border-gray-800 space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#5B4DFF]" />
          Sécurité & Confidentialité
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Gérez votre mot de passe et l'accès à votre profil civique CIVITAS.
        </p>
      </div>
    </div>
  );
}
