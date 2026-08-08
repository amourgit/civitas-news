import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installAuthFetchInterceptor } from './services/api/token/authFetchInterceptor';
import { env } from './config/env';

if (typeof window !== 'undefined') {
  try {
    let _fetch = window.fetch;
    const fetchProp = {
      get: () => _fetch,
      set: (v: any) => {
        _fetch = v;
      },
      configurable: true,
      enumerable: true,
    };
    try {
      Object.defineProperty(window, 'fetch', fetchProp);
    } catch {}
    try {
      if (window.Window && window.Window.prototype) {
        Object.defineProperty(window.Window.prototype, 'fetch', fetchProp);
      }
    } catch {}
    try {
      if (typeof globalThis !== 'undefined') {
        Object.defineProperty(globalThis, 'fetch', fetchProp);
      }
    } catch {}
  } catch {
    // ignore
  }
}

// Refresh automatique et transparent des tokens expirés — voir
// authFetchInterceptor.ts pour le pourquoi de cette approche globale.
installAuthFetchInterceptor(env.apiBaseUrl);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
