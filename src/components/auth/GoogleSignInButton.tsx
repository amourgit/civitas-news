// ============================================================
// src/components/auth/GoogleSignInButton.tsx
// Bouton "Sign in with Google" réel, via Google Identity Services
// (GSI) — la bibliothèque officielle actuelle de Google, pas l'ancien
// gapi.auth2 (déprécié). Pas de dépendance npm : le script GSI est
// chargé dynamiquement, comme documenté par Google lui-même.
//
// Flux : l'utilisateur clique le bouton officiel Google (rendu par
// Google lui-même dans un <div> qu'on lui confie — c'est un choix
// délibéré de Google pour la sécurité/anti-clickjacking, on ne peut
// pas construire ce bouton soi-même) -> Google ouvre son propre
// popup/flow -> callback(credential) reçoit un id_token JWT signé par
// Google -> on l'envoie tel quel à authRepository.loginWithGoogle(),
// qui l'envoie à POST /token/v1/google/. Le frontend ne vérifie JAMAIS
// ce token lui-même — seule la vérification serveur (signature +
// audience) fait foi.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { env } from '../../config/env';

interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  ux_mode?: 'popup' | 'redirect';
}

interface GoogleAccountsId {
  initialize: (config: GoogleIdConfiguration) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
  prompt: () => void;
  cancel: () => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
let scriptLoadPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Échec du chargement du script Google.')));
      return;
    }
    const script = document.createElement('script');
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Échec du chargement du script Google.'));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

interface GoogleSignInButtonProps {
  /** Reçoit le id_token Google brut (`credential`) — à transmettre tel quel à authRepository.loginWithGoogle(). */
  onCredential: (credential: string) => void;
  /** Désactive le bouton pendant une soumission en cours (login/register déjà en vol). */
  disabled?: boolean;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

export default function GoogleSignInButton({ onCredential, disabled, text = 'signin_with' }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'unconfigured' | 'error'>('loading');

  useEffect(() => {
    if (!env.googleClientId) {
      setState('unconfigured');
      return;
    }

    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: env.googleClientId,
          callback: (response) => onCredential(response.credential),
          ux_mode: 'popup',
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: 320,
          text,
          shape: 'pill',
          logo_alignment: 'center',
        });
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === 'unconfigured') {
    return (
      <div
        title="Connexion Google non configurée sur cet environnement (VITE_GOOGLE_CLIENT_ID manquant)."
        className="w-full flex items-center justify-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 text-sm font-semibold text-gray-400 dark:text-gray-500 cursor-not-allowed select-none"
      >
        <GoogleGlyph className="opacity-40" />
        Google (indisponible)
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="w-full text-center text-xs font-medium text-red-500 border border-red-200 dark:border-red-900/50 rounded-full px-4 py-2.5">
        Impossible de charger Google Sign-In. Vérifiez votre connexion.
      </div>
    );
  }

  return (
    <div className={`w-full flex justify-center ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
      {state === 'loading' && (
        <div className="w-full flex items-center justify-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-400 animate-pulse">
          <GoogleGlyph className="opacity-40" />
          Chargement…
        </div>
      )}
      <div ref={containerRef} className={state === 'loading' ? 'hidden' : ''} />
    </div>
  );
}

function GoogleGlyph({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.71v2.26h2.9c1.7-1.57 2.68-3.87 2.68-6.61z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 009 18z"
      />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.68 9c0-.59.1-1.17.27-1.7V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l2.99-2.34z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.96 4.96l2.99 2.34C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  );
}
