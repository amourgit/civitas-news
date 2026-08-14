// ============================================================
// src/pages/auth/RegisterPage.tsx
// Inscription réelle, volontairement réduite à deux champs — email OU
// numéro de téléphone (`identifiant`, détecté automatiquement côté
// backend) + un mot de passe (POST /token/v1/register/, auto-connexion)
// — ou Google (POST /token/v1/google/). Pas de confirmation de mot de
// passe : simplicité et rapidité d'inscription voulues, quitte à ce
// qu'une faute de frappe se corrige ensuite via "mot de passe oublié"
// plutôt qu'en amont via un second champ.
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
  identifiant?: string;
  password?: string;
}

/**
 * DRF renvoie les erreurs de validation par champ :
 * { "identifiant": ["Un compte existe déjà avec cet identifiant."], ... }
 * (voir IdentifiantRegisterSerializer côté backend). On les remonte
 * sous chaque champ plutôt que d'afficher un message générique.
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

  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword] = useState('');
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
        <div>
          <label htmlFor="reg_identifiant" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
            Email ou téléphone
          </label>
          <input
            id="reg_identifiant"
            type="text"
            value={identifiant}
            onChange={(e) => setIdentifiant(e.target.value)}
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
          id="reg_password"
          label="Mot de passe"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
          error={fieldErrors.password}
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
