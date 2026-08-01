import { useState, useEffect } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

let toasts: ToastMessage[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function toast(type: ToastMessage['type'], title: string, message?: string, duration = 4000) {
  const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
  const newToast: ToastMessage = { id, type, title, message, duration };
  toasts = [...toasts, newToast];
  notify();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, duration);
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

  const removeToast = (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  };

  return {
    toasts: activeToasts,
    removeToast,
    toast,
    success: (title: string, msg?: string) => toast('success', title, msg),
    error: (title: string, msg?: string) => toast('error', title, msg),
    info: (title: string, msg?: string) => toast('info', title, msg),
    warning: (title: string, msg?: string) => toast('warning', title, msg),
  };
}
