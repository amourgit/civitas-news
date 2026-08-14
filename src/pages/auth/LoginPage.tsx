// ============================================================
// src/pages/auth/LoginPage.tsx
// Connexion réelle — identifiant unique (email OU numéro de téléphone,
// détecté automatiquement côté backend) + password (POST /token/v1/),
// ou Google (POST /token/v1/google/).
//
// Si `identifiant` ne correspond à AUCUN compte existant (backend :
// code='ACCOUNT_NOT_FOUND'), on propose de créer le compte avec les
// identifiants déjà saisis plutôt que de renvoyer vers /auth/register
// -- l'utilisateur n'a rien à ressaisir. On ne propose JAMAIS cette
// création quand l'identifiant existe mais que le mot de passe est
// incorrect (code='INVALID_CREDENTIALS') : dans ce cas il s'agit très
// probablement d'un mot de passe oublié, pas d'un nouveau compte, et
// créer un compte à ce moment-là créerait un doublon.
// ============================================================

import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Fingerprint, UserPlus } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import ComingSoonProviderButton from '../../components/auth/ComingSoonProviderButton';
import PasswordField from '../../components/auth/PasswordField';
import { useAuthStore } from '../../store/auth.store';
import { toast } from '../../hooks/useToast';
import { ApiError } from '../../services/api/errors';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loginWithGoogle } = useAuthStore();

  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // true dès que le backend confirme qu'AUCUN compte n'existe pour
  // l'identifiant saisi -- déclenche la proposition de création,
  // distincte d'une simple erreur (voir handleSubmit).
  const [accountNotFound, setAccountNotFound] = useState(false);

  const redirectTo = (location.state as { from?: string } | null)?.from || '/';

  const goAfterLogin = (nomAffiche: string) => {
    toast('success', `Bon retour, ${nomAffiche} !`);
    navigate(redirectTo, { replace: true });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setAccountNotFound(false);
    if (!identifiant.trim() || !password) {
      setFormError('Identifiant (email ou téléphone) et mot de passe sont requis.');
      return;
    }
    setSubmitting(true);
    try {
      const profile = await login(identifiant.trim(), password);
      goAfterLogin(profile.nomAffiche);
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

  /** Confirmation de la proposition de création -- réutilise l'identifiant/mot de passe déjà saisis. */
  const handleCreateAccount = async () => {
    setFormError(null);
    setSubmitting(true);
    try {
      const profile = await register({ identifiant: identifiant.trim(), password });
      setAccountNotFound(false);
      toast(
        'success',
        'Compte créé',
        `Aucun compte n'existait pour « ${identifiant.trim()} » — nous en avons créé un nouveau avec les identifiants saisis.`
      );
      goAfterLogin(profile.nomAffiche);
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
      goAfterLogin(profile.nomAffiche);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Connexion Google impossible pour le moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Connexion"
      subtitle="Accédez à l'actualité de votre établissement"
      footer={
        <span className="text-gray-500 dark:text-gray-400">
          Pas encore de compte ?{' '}
          <Link to="/auth/register" className="font-bold text-[#5B4DFF] hover:underline">
            Créer un compte
          </Link>
        </span>
      }
    >
      <div className="space-y-3 mb-6">
        <GoogleSignInButton onCredential={handleGoogleCredential} disabled={submitting} />
        <ComingSoonProviderButton label="ID-Gab" icon={<Fingerprint className="w-4 h-4" />} />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">ou</span>
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="identifiant" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            Email ou téléphone
          </label>
          <input
            id="identifiant"
            type="text"
            value={identifiant}
            onChange={(e) => {
              setIdentifiant(e.target.value);
              setAccountNotFound(false);
            }}
            placeholder="vous@exemple.com ou 074 12 34 56"
            autoComplete="username"
            required
            className="w-full px-3.5 py-2.75 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/30 focus:border-[#5B4DFF] transition-all"
          />
        </div>

        <PasswordField
          id="password"
          label="Mot de passe"
          value={password}
          onChange={(value) => {
            setPassword(value);
            setAccountNotFound(false);
          }}
          autoComplete="current-password"
          required
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
          <LogIn className="w-4 h-4" />
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </AuthLayout>
  );
}
