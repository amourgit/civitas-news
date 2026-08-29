import { useState, useEffect } from 'react';

export interface ToastAction {
  label: string;
  onClick: () => void;
  /** 'primary' = bouton plein (ex: "Confirmer") ; 'secondary' = bouton
   * discret (ex: "Annuler"). Par défaut : primary pour la 1ère action,
   * secondary pour les suivantes. */
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'purple';
  title: string;
  message?: string;
  duration?: number;
  /** Boutons d'action (ex: Oui/Non, Confirmer/Annuler). Quand présentes,
   * le toast ne se ferme JAMAIS tout seul (voir toastAction ci-dessous) :
   * il faut laisser le temps de décider, pas le faire disparaître sous
   * l'utilisateur. */
  actions?: ToastAction[];
}

let toasts: ToastMessage[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function pushToast(toastData: Omit<ToastMessage, 'id'>): string {
  const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  toasts = [...toasts, { ...toastData, id }];
  notify();

  // Pas d'auto-dismiss pour un toast à actions : l'utilisateur doit
  // explicitement choisir, sinon une action importante (confirmer une
  // suppression, valider une modération...) pourrait disparaître sans
  // avoir été traitée.
  if (!toastData.actions || toastData.actions.length === 0) {
    const duration = toastData.duration ?? 4000;
    setTimeout(() => dismissToast(id), duration);
  }

  return id;
}

function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

/** Toast simple (succès / erreur / info / warning), auto-disparaît après `duration` ms. */
export function toast(type: ToastMessage['type'], title: string, message?: string, duration = 4000) {
  pushToast({ type, title, message, duration });
}

/** Toast avec boutons d'action (ex: Confirmer/Annuler, Oui/Non) -- reste affiché
 * jusqu'à ce que l'utilisateur choisisse une action ou ferme le toast.
 * Chaque `onClick` fourni ferme automatiquement le toast après exécution. */
export function toastAction(
  type: ToastMessage['type'],
  title: string,
  actions: ToastAction[],
  message?: string
): string {
  const id = pushToast({
    type,
    title,
    message,
    actions: actions.map((action) => ({
      ...action,
      onClick: () => {
        action.onClick();
        dismissToast(id);
      },
    })),
  });
  return id;
}

/** Raccourci pour le cas le plus courant : une confirmation à deux choix. */
export function toastConfirm(
  title: string,
  onConfirm: () => void,
  options?: {
    message?: string;
    onCancel?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    /** 'warning' par défaut (ex: suppression) ; passer 'info' pour une confirmation neutre. */
    type?: ToastMessage['type'];
    /** Style du bouton de confirmation -- 'danger' pour une action destructive. */
    confirmVariant?: ToastAction['variant'];
  }
): string {
  return toastAction(options?.type ?? 'warning', title, [
    { label: options?.confirmLabel ?? 'Confirmer', onClick: onConfirm, variant: options?.confirmVariant ?? 'primary' },
    { label: options?.cancelLabel ?? 'Annuler', onClick: options?.onCancel ?? (() => {}), variant: 'secondary' },
  ], options?.message);
}

export function useToast() {
  const [activeToasts, setActiveToasts] = useState<ToastMessage[]>(toasts);

  useEffect(() => {
    const handleChange = () => setActiveToasts([...toasts]);
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  return {
    toasts: activeToasts,
    removeToast: dismissToast,
    toast,
    toastAction,
    toastConfirm,
    success: (title: string, msg?: string) => toast('success', title, msg),
    error: (title: string, msg?: string) => toast('error', title, msg),
    info: (title: string, msg?: string) => toast('info', title, msg),
    warning: (title: string, msg?: string) => toast('warning', title, msg),
    purple: (title: string, msg?: string) => toast('purple', title, msg),
  };
}
