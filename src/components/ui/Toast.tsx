import React from 'react';
import { useToast, type ToastAction } from '../../hooks/useToast';
import { CheckCircle2, AlertTriangle, Info, XCircle, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ACTION_BUTTON_STYLES: Record<NonNullable<ToastAction['variant']>, string> = {
  primary: 'bg-[#5B4DFF] hover:bg-[#4a3ecc] text-white',
  secondary: 'bg-transparent hover:bg-black/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white',
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
    purple: <Sparkles className="w-5 h-5 text-purple-500 shrink-0" />,
  };

  const borderStyles = {
    success: 'border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/80 dark:bg-emerald-950/60',
    warning: 'border-amber-200 dark:border-amber-800/70 bg-amber-50/80 dark:bg-amber-950/60',
    error: 'border-rose-200 dark:border-rose-800/70 bg-rose-50/80 dark:bg-rose-950/60',
    info: 'border-blue-200 dark:border-blue-800/70 bg-blue-50/80 dark:bg-blue-950/60',
    purple: 'border-purple-200 dark:border-purple-800/70 bg-purple-50/80 dark:bg-purple-950/60',
  };

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-[calc(100%-2.5rem)] sm:w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            role={t.actions && t.actions.length > 0 ? 'alertdialog' : 'status'}
            className={`pointer-events-auto flex flex-col gap-2.5 p-4 rounded-2xl shadow-xl border backdrop-blur-md ${
              borderStyles[t.type] || 'bg-white dark:bg-[#1A1F4D] border-gray-100 dark:border-gray-800'
            }`}
          >
            <div className="flex items-start gap-3">
              {icons[t.type]}
              <div className="flex-1 text-sm">
                <h4 className="font-extrabold text-gray-900 dark:text-white font-display text-xs sm:text-sm">{t.title}</h4>
                {t.message && <p className="text-gray-600 dark:text-gray-300 text-xs mt-0.5 leading-snug">{t.message}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg transition-colors shrink-0"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {t.actions && t.actions.length > 0 && (
              <div className="flex items-center justify-end gap-2 pl-8">
                {t.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      ACTION_BUTTON_STYLES[action.variant ?? (index === 0 ? 'primary' : 'secondary')]
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
