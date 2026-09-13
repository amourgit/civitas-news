import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { installAuthFetchInterceptor } from './services/api/token/authFetchInterceptor';
import { startPublicTenantsLifecycle } from './services/api/publicTenantsLifecycle';
import { env } from './config/env';
import { getTenantHeaderValue, getTenantHeaderListValue } from './store/tenants.store';

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

// Refresh automatique et transparent des tokens expirés, + en-tête
// X-Tenant-Domain sur chaque requête : liste combinée (tenant courant +
// tenants publics) sur les GET, tenant courant seul sur les écritures —
// voir authFetchInterceptor.ts et store/tenants.store.ts.
installAuthFetchInterceptor(env.apiBaseUrl, getTenantHeaderValue, getTenantHeaderListValue);

// Annuaire des tenants publics (Ministères, Mutuelles...) : un premier
// GET immédiat puis un rafraîchissement périodique, voir
// services/api/publicTenantsLifecycle.ts. Indépendant de
// l'authentification — utile même à un visiteur anonyme.
startPublicTenantsLifecycle();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
