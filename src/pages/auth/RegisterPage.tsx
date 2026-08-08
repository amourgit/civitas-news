// ============================================================
// src/pages/auth/RegisterPage.tsx
// Inscription réelle (POST /token/v1/register/, auto-connexion) ou
// Google (POST /token/v1/google/). Remplace l'ancien alias vers
// LoginPage.tsx (aucun vrai formulaire d'inscription n'existait).
// ============================================================

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Fingerprint } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import ComingSoonProviderButton from '../../components/auth/ComingSoonProviderButton';
import PasswordField from '../../components/auth/PasswordField';
import { useAuthStore } from '../../store/auth.store';
import { toast } from '../../hooks/useToast';
import { ApiError } from '../../services/api/errors';

interface FieldErrors {
  username?: string;
  email?: string;
  password?: string;
  password2?: string;
  first_name?: string;
  last_name?: string;
}

/**
 * DRF renvoie les erreurs de validation par champ :
 * { "username": ["Un utilisateur avec ce nom existe déjà."], ... }
 * (voir UserCreateSerializer côté backend). On les remonte sous chaque
 * champ plutôt que d'afficher un message générique inutilisable.
 */
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

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const goAfterRegister = (nomAffiche: string) => {
    toast('success', `Bienvenue, ${nomAffiche} !`, 'Votre compte a été créé avec succès.');
    navigate('/', { replace: true });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (password !== password2) {
      setFieldErrors({ password2: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    if (password.length < 8) {
      setFieldErrors({ password: 'Le mot de passe doit contenir au moins 8 caractères.' });
      return;
    }

    setSubmitting(true);
    try {
      const profile = await register({
        username: username.trim(),
        email: email.trim() || undefined,
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
        password,
        password2,
      });
      goAfterRegister(profile.nomAffiche);
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

  const handleGoogleCredential = async (credential: string) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const profile = await loginWithGoogle(credential);
      goAfterRegister(profile.nomAffiche);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Inscription via Google impossible pour le moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Créer un compte"
      subtitle="Rejoignez la communauté de votre établissement"
      footer={
        <span className="text-gray-500 dark:text-gray-400">
          Déjà inscrit ?{' '}
          <Link to="/auth/login" className="font-bold text-[#5B4DFF] hover:underline">
            Se connecter
          </Link>
        </span>
      }
    >
      <div className="space-y-3 mb-6">
        <GoogleSignInButton onCredential={handleGoogleCredential} disabled={submitting} text="signup_with" />
        <ComingSoonProviderButton label="ID-Gab" icon={<Fingerprint className="w-4 h-4" />} />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">ou</span>
        <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="first_name" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Prénom
            </label>
            <input
              id="first_name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              className="w-full px-3.5 py-2.75 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/30 focus:border-[#5B4DFF] transition-all"
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
              Nom
            </label>
            <input
              id="last_name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              className="w-full px-3.5 py-2.75 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/30 focus:border-[#5B4DFF] transition-all"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg_username" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            Identifiant
          </label>
          <input
            id="reg_username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="nom d'utilisateur"
            autoComplete="username"
            required
            aria-invalid={Boolean(fieldErrors.username)}
            className={`w-full px-3.5 py-2.75 rounded-xl border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
              fieldErrors.username
                ? 'border-red-400 focus:ring-red-200 dark:focus:ring-red-900'
                : 'border-gray-200 dark:border-gray-700 focus:ring-[#5B4DFF]/30 focus:border-[#5B4DFF]'
            }`}
          />
          {fieldErrors.username && <p className="mt-1 text-xs font-medium text-red-500">{fieldErrors.username}</p>}
        </div>

        <div>
          <label htmlFor="reg_email" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            Email <span className="normal-case font-medium text-gray-400">(optionnel)</span>
          </label>
          <input
            id="reg_email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            autoComplete="email"
            aria-invalid={Boolean(fieldErrors.email)}
            className={`w-full px-3.5 py-2.75 rounded-xl border text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
              fieldErrors.email
                ? 'border-red-400 focus:ring-red-200 dark:focus:ring-red-900'
                : 'border-gray-200 dark:border-gray-700 focus:ring-[#5B4DFF]/30 focus:border-[#5B4DFF]'
            }`}
          />
          {fieldErrors.email && <p className="mt-1 text-xs font-medium text-red-500">{fieldErrors.email}</p>}
        </div>

        <PasswordField
          id="reg_password"
          label="Mot de passe"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
          error={fieldErrors.password}
        />

        <PasswordField
          id="reg_password2"
          label="Confirmer le mot de passe"
          value={password2}
          onChange={setPassword2}
          autoComplete="new-password"
          required
          error={fieldErrors.password2}
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
          <UserPlus className="w-4 h-4" />
          {submitting ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
    </AuthLayout>
  );
}
