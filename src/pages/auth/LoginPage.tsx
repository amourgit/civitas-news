// ============================================================
// src/pages/auth/LoginPage.tsx
// Connexion réelle — username/password (POST /token/v1/) ou Google
// (POST /token/v1/google/). Remplace l'ancienne version 100% mockée
// (modal Google simulée, "quick role presets").
// ============================================================

import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Fingerprint } from 'lucide-react';
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
  const { login, loginWithGoogle } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const redirectTo = (location.state as { from?: string } | null)?.from || '/';

  const goAfterLogin = (nomAffiche: string) => {
    toast('success', `Bon retour, ${nomAffiche} !`);
    navigate(redirectTo, { replace: true });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!username.trim() || !password) {
      setFormError('Identifiant et mot de passe sont requis.');
      return;
    }
    setSubmitting(true);
    try {
      const profile = await login(username.trim(), password);
      goAfterLogin(profile.nomAffiche);
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Identifiant ou mot de passe incorrect."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setFormError(null);
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
          <label htmlFor="username" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            Identifiant
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="nom d'utilisateur"
            autoComplete="username"
            required
            className="w-full px-3.5 py-2.75 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/30 focus:border-[#5B4DFF] transition-all"
          />
        </div>

        <PasswordField
          id="password"
          label="Mot de passe"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
        />

        {formError && (
          <p role="alert" className="text-sm font-medium text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
            {formError}
          </p>
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
