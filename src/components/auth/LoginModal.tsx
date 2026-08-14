// ============================================================
// src/components/auth/LoginModal.tsx
// Popup de connexion — remplace les pages dédiées /auth/login et
// /auth/register (supprimées). Montée une seule fois au niveau App.tsx,
// pilotée par useUiStore().loginModalOpen : n'importe quel composant
// (typiquement le bouton "Se connecter" de la topbar) peut l'ouvrir
// depuis n'importe quelle page via openLoginModal(), sans navigation.
//
// La connexion reste STRICTEMENT OPTIONNELLE (voir Header.tsx : plus
// aucune route ni requête n'exige de session) — ce popup ne fait que
// permettre à un visiteur anonyme d'associer une identité à ses
// actions s'il le souhaite. Après succès, on ferme simplement le popup
// SANS naviguer : contrairement à l'ancienne page dédiée, ce popup
// peut s'ouvrir depuis n'importe quelle page (ex: en lisant un
// article) — rediriger vers l'accueil serait une régression UX.
//
// Deux modes dans le MÊME popup (pas de seconde page) :
// - 'login'    : identifiant + password. Si le backend répond
//                code='ACCOUNT_NOT_FOUND', on propose de créer le
//                compte avec les identifiants déjà saisis (jamais sur
//                un mot de passe simplement oublié, code=
//                'INVALID_CREDENTIALS' — voir CustomTokenObtainPairView
//                côté backend).
// - 'register' : identifiant + password, création directe -- pour qui
//                sait d'emblée ne pas avoir de compte.
// ============================================================

import { useEffect, useState, type FormEvent } from 'react';
import { X, LogIn, UserPlus, Fingerprint } from 'lucide-react';
import { useUiStore } from '../../store/ui.store';
import { useAuthStore } from '../../store/auth.store';
import { toast } from '../../hooks/useToast';
import { ApiError } from '../../services/api/errors';
import GoogleSignInButton from './GoogleSignInButton';
import ComingSoonProviderButton from './ComingSoonProviderButton';
import PasswordField from './PasswordField';

type Mode = 'login' | 'register';

interface FieldErrors {
  identifiant?: string;
  password?: string;
}

function extractFieldErrors(details: unknown): FieldErrors {
  if (!details || typeof details !== 'object') return {};
  const result: FieldErrors = {};
  for (const [field, value] of Object.entries(details as Record<string, unknown>)) {
    if (Array.isArray(value) && typeof value[0] === 'string') {
      (result as Record<string, string>)[field] = value[0];
    }
  }
  return result;
}

export default function LoginModal() {
  const { loginModalOpen, closeLoginModal } = useUiStore();
  const { login, register, loginWithGoogle } = useAuthStore();

  const [mode, setMode] = useState<Mode>('login');
  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [accountNotFound, setAccountNotFound] = useState(false);

  // Reset complet à chaque (ré)ouverture -- on ne veut jamais réafficher
  // le mot de passe ou l'erreur d'une tentative précédente.
  useEffect(() => {
    if (loginModalOpen) {
      setMode('login');
      setIdentifiant('');
      setPassword('');
      setSubmitting(false);
      setFormError(null);
      setFieldErrors({});
      setAccountNotFound(false);
    }
  }, [loginModalOpen]);

  // Fermeture au clavier (Échap) tant que le popup est ouvert.
  useEffect(() => {
    if (!loginModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLoginModal();
    };
    window.addEventListener('keydown', onKeyDown);
    // Empêche le scroll de la page derrière le popup.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [loginModalOpen, closeLoginModal]);

  if (!loginModalOpen) return null;

  const onSuccess = (message: string) => {
    toast('success', message);
    closeLoginModal();
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setAccountNotFound(false);
    if (!identifiant.trim() || !password) {
      setFormError('Identifiant (email ou téléphone) et mot de passe sont requis.');
      return;
    }
    setSubmitting(true);
    try {
      const profile = await login(identifiant.trim(), password);
      onSuccess(`Bon retour, ${profile.nomAffiche} !`);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'ACCOUNT_NOT_FOUND') {
        setAccountNotFound(true);
      } else {
        setFormError(error instanceof ApiError ? error.message : 'Identifiant ou mot de passe incorrect.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    if (!identifiant.trim()) {
      setFieldErrors({ identifiant: 'Entrez un email ou un numéro de téléphone.' });
      return;
    }
    if (password.length < 8) {
      setFieldErrors({ password: 'Le mot de passe doit contenir au moins 8 caractères.' });
      return;
    }
    setSubmitting(true);
    try {
      const profile = await register({ identifiant: identifiant.trim(), password });
      onSuccess(`Bienvenue, ${profile.nomAffiche} ! Votre compte a été créé.`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        const errors = extractFieldErrors(error.details);
        if (Object.keys(errors).length > 0) {
          setFieldErrors(errors);
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError(error instanceof ApiError ? error.message : "L'inscription a échoué. Veuillez réessayer.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  /** Confirmation de la proposition "aucun compte trouvé -> en créer un". */
  const handleCreateAccount = async () => {
    setFormError(null);
    setSubmitting(true);
    try {
      const profile = await register({ identifiant: identifiant.trim(), password });
      setAccountNotFound(false);
      onSuccess(
        `Aucun compte n'existait pour « ${identifiant.trim()} » — nous en avons créé un nouveau avec les identifiants saisis (${profile.nomAffiche}).`
      );
    } catch (error) {
      setAccountNotFound(false);
      setFormError(error instanceof ApiError ? error.message : 'Impossible de créer le compte pour le moment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setFormError(null);
    setAccountNotFound(false);
    setSubmitting(true);
    try {
      const profile = await loginWithGoogle(credential);
      onSuccess(`Bon retour, ${profile.nomAffiche} !`);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Connexion Google impossible pour le moment.');
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === 'login' ? 'Connexion' : 'Créer un compte';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeLoginModal();
      }}
    >
      <div className="w-full max-w-[420px] bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xl p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={closeLoginModal}
          aria-label="Fermer"
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-all"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        <div className="mb-6 pr-8">
          <h2 id="login-modal-title" className="text-xl font-extrabold text-gray-900 dark:text-white">
            {title}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {mode === 'login'
              ? 'La connexion reste optionnelle — vous pouvez continuer anonymement.'
              : 'Un identifiant, un mot de passe : simple et rapide.'}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <GoogleSignInButton onCredential={handleGoogleCredential} disabled={submitting} text={mode === 'login' ? 'signin_with' : 'signup_with'} />
          <ComingSoonProviderButton label="ID-Gab" icon={<Fingerprint className="w-4 h-4" />} />
        </div>

        <div className="flex items-center gap-3 mb-6">
          <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">ou</span>
          <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
        </div>

        <form onSubmit={mode === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="modal_identifiant" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Email ou téléphone
            </label>
            <input
              id="modal_identifiant"
              type="text"
              value={identifiant}
              onChange={(e) => {
                setIdentifiant(e.target.value);
                setAccountNotFound(false);
              }}
              placeholder="vous@exemple.com ou 074 12 34 56"
              autoComplete="username"
              required
              aria-invalid={Boolean(fieldErrors.identifiant)}
              className={`w-full px-3.5 py-2.75 rounded-xl border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
                fieldErrors.identifiant
                  ? 'border-red-400 focus:ring-red-200 dark:focus:ring-red-900'
                  : 'border-gray-200 dark:border-gray-700 focus:ring-[#5B4DFF]/30 focus:border-[#5B4DFF]'
              }`}
            />
            {fieldErrors.identifiant && <p className="mt-1 text-xs font-medium text-red-500">{fieldErrors.identifiant}</p>}
          </div>

          <PasswordField
            id="modal_password"
            label="Mot de passe"
            value={password}
            onChange={(value) => {
              setPassword(value);
              setAccountNotFound(false);
            }}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
            error={fieldErrors.password}
          />

          {formError && (
            <p role="alert" className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          {accountNotFound && (
            <div role="alert" className="rounded-xl border border-[#5B4DFF]/30 bg-[#5B4DFF]/5 dark:bg-[#5B4DFF]/10 px-3.5 py-3 space-y-2.5">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Aucun compte n'est associé à <strong>{identifiant.trim()}</strong>.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Voulez-vous créer un compte avec cet identifiant et ce mot de passe ?
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCreateAccount}
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#5B4DFF] hover:bg-[#5B4DFF]/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs py-2.5 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Créer mon compte
                </button>
                <button
                  type="button"
                  onClick={() => setAccountNotFound(false)}
                  disabled={submitting}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold text-xs px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#5B4DFF] hover:bg-[#5B4DFF]/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm py-3 transition-all"
          >
            {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {submitting ? (mode === 'login' ? 'Connexion…' : 'Création…') : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
          {mode === 'login' ? (
            <>
              Pas encore de compte ?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setFormError(null);
                  setFieldErrors({});
                  setAccountNotFound(false);
                }}
                className="font-bold text-[#5B4DFF] hover:underline"
              >
                Créer un compte
              </button>
            </>
          ) : (
            <>
              Déjà inscrit ?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setFormError(null);
                  setFieldErrors({});
                }}
                className="font-bold text-[#5B4DFF] hover:underline"
              >
                Se connecter
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
