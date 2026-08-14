import { useState, useEffect } from 'react';

interface UiState {
  theme: 'light' | 'dark';
  mobileMenuOpen: boolean;
  searchQuery: string;
  loginModalOpen: boolean;
}

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('civitas_theme');
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      // Ignore localStorage read errors
    }
  }
  return 'light';
};

const applyThemeToDOM = (theme: 'light' | 'dark') => {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem('civitas_theme', theme);
    } catch (e) {
      // Ignore localStorage write errors
    }
  }
};

const initialTheme = getInitialTheme();
applyThemeToDOM(initialTheme);

let state: UiState = {
  theme: initialTheme,
  mobileMenuOpen: false,
  searchQuery: '',
  loginModalOpen: false,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function useUiStore() {
  const [ui, setUi] = useState<UiState>(state);

  useEffect(() => {
    const handleChange = () => setUi({ ...state });
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const toggleTheme = () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyThemeToDOM(state.theme);
    notify();
  };

  const setTheme = (theme: 'light' | 'dark') => {
    if (state.theme !== theme) {
      state.theme = theme;
      applyThemeToDOM(state.theme);
      notify();
    }
  };

  const toggleMobileMenu = () => {
    state.mobileMenuOpen = !state.mobileMenuOpen;
    notify();
  };

  const setMobileMenuOpen = (open: boolean) => {
    state.mobileMenuOpen = open;
    notify();
  };

  const setSearchQuery = (q: string) => {
    state.searchQuery = q;
    notify();
  };

  /**
   * Connexion en popup (voir components/auth/LoginModal.tsx) — plus de
   * page /auth/login dédiée : ce store pilote son ouverture/fermeture
   * depuis n'importe quel point de l'app (topbar, ProfilPage après
   * déconnexion, etc.), pas seulement Header.
   */
  const openLoginModal = () => {
    state.loginModalOpen = true;
    notify();
  };

  const closeLoginModal = () => {
    state.loginModalOpen = false;
    notify();
  };

  return {
    ...ui,
    toggleTheme,
    setTheme,
    toggleMobileMenu,
    setMobileMenuOpen,
    setSearchQuery,
    openLoginModal,
    closeLoginModal,
  };
}
