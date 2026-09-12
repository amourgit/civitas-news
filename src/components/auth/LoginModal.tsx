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
// actions s'il le souhaite. Après succès (login, inscription ou
// Google), on ferme le popup PUIS on redirige vers "/" -- demande
// explicite pour rendre l'issue de la connexion/déconnexion visible
// plutôt que de rester silencieusement sur la page courante.
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
//
// ---- Design ------------------------------------------------
// Habillage "verre dépoli" en deux temps (identifiant, puis mot de
// passe) inspiré d'une maquette fournie, adapté à ce popup COMPACT
// (jamais plein écran) et aux deux seuls champs réellement gérés par
// le backend (pas de champ "confirmation de mot de passe" -- il
// n'existe pas côté API, on ne l'invente pas ici). Les primitives
// purement visuelles (GlassButton, BlurFade, TextLoop, fond dégradé,
// confettis) vivent dans AuthGlassKit.tsx ; AUCUNE des fonctions
// ci-dessous ne change de comportement métier par rapport à l'ancienne
// version -- seul l'habillage change, y compris le léger temps de
// pause + confettis avant fermeture, qui ne fait que retarder de
// quelques centaines de ms le même toast/close/navigate qu'avant.
// ============================================================

import { useEffect, useState, useRef, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X, LogIn, UserPlus, Fingerprint, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, PartyPopper, Loader } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUiStore } from '../../store/ui.store';
import { useAuthStore } from '../../store/auth.store';
import { toast } from '../../hooks/useToast';
import { ApiError } from '../../services/api/errors';
import GoogleSignInButton from './GoogleSignInButton';
import ComingSoonProviderButton from './ComingSoonProviderButton';
import { TenantSelectButton } from './TenantSelectButton';
import { AuthGlassStyles, AuthGradientBackground, GlassButton, BlurFade, TextLoop, MiniConfetti, type MiniConfettiHandle } from './AuthGlassKit';
import { getCurrentTenant, getRecentTenants, switchTenant, type TenantRef } from '../../store/tenants.store';

type Mode = 'login' | 'register';
type Step = 'identifiant' | 'password';

interface FieldErrors {
  identifiant?: string;
  password?: string;
}

/**
 * getCurrentTenant() peut renvoyer une valeur qui n'a JAMAIS été
 * choisie par personne : env.tenantHost / le hostname du navigateur
 * servent d'amorce à la navigation anonyme (voir
 * tenants.store.ts::ensureHydrated, config/env.ts) avant tout choix
 * explicite -- légitime pour afficher du contenu public, mais PAS pour
 * pré-remplir silencieusement le sélecteur de connexion : une telle
 * amorce n'alimente JAMAIS recentTenants (seul switchTenant() le fait,
 * lui-même appelé uniquement sur un choix explicite ou un login
 * réussi). Sa présence signale donc un VRAI historique, jamais un
 * simple repli -- c'est le test à utiliser ici pour respecter "toujours
 * choisir explicitement", pas getCurrentTenant() seul.
 */
function resolveGenuinelyChosenTenant(): TenantRef | null {
  return getRecentTenants().length > 0 ? getCurrentTenant() : null;
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
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>('login');
  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [accountNotFound, setAccountNotFound] = useState(false);

  // Organisation (tenant) ciblée par CETTE tentative de connexion ou
  // d'inscription -- jamais deviné, toujours un choix explicite (voir
  // TenantSelectButton.tsx). Pré-rempli avec le tenant courant connu du
  // store (dernier visité sur cet appareil, ou repli historique) pour
  // ne pas pénaliser un utilisateur qui revient, mais reste soumis à la
  // même validation que n'importe quel autre champ requis ci-dessous.
  const [selectedTenant, setSelectedTenant] = useState<TenantRef | null>(resolveGenuinelyChosenTenant);
  const [tenantError, setTenantError] = useState(false);

  // --- État purement visuel (étapes du popup, visibilité du mot de
  // passe, message de succès affiché pendant la pause+confettis avant
  // fermeture) -- ne change jamais la façon dont une connexion, une
  // inscription ou une erreur sont traitées ci-dessous. ---
  const [step, setStep] = useState<Step>('identifiant');
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confettiRef = useRef<MiniConfettiHandle>(null);

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
      setStep('identifiant');
      setShowPassword(false);
      setSuccessMessage(null);
      // Resynchronise sur le tenant courant réel : il a pu changer
      // ailleurs (switch rapide) pendant que ce popup était fermé.
      setSelectedTenant(resolveGenuinelyChosenTenant());
      setTenantError(false);
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

  // Focus automatique sur le champ mot de passe à l'arrivée sur cette
  // étape (même principe que l'ancienne version, adapté aux 2 étapes
  // réelles de ce popup : identifiant, puis mot de passe).
  useEffect(() => {
    if (step === 'password') {
      const id = setTimeout(() => passwordInputRef.current?.focus(), 350);
      return () => clearTimeout(id);
    }
  }, [step]);

  if (!loginModalOpen) return null;

  const isIdentifiantFilled = identifiant.trim().length > 0;

  const goToPasswordStep = () => {
    if (!selectedTenant) {
      setTenantError(true);
      return;
    }
    if (!isIdentifiantFilled || submitting) return;
    setStep('password');
  };

  /**
   * Injection IMMÉDIATE dans tenants.store, dès le clic -- pas
   * seulement à la soumission du formulaire (voir en-tête de
   * TenantSelectButton.tsx) : GoogleSignInButton peut être cliqué
   * juste après, avant tout envoi de identifiant/password.
   */
  const handleTenantSelect = (tenant: TenantRef) => {
    setSelectedTenant(tenant);
    setTenantError(false);
    switchTenant(tenant);
  };

  const goBackToIdentifiantStep = () => {
    if (submitting) return;
    setStep('identifiant');
  };

  const handleIdentifiantKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      goToPasswordStep();
    }
  };

  /**
   * Termine une connexion/inscription réussie. Comportement final
   * INCHANGÉ (toast de succès, fermeture du popup, redirection vers
   * "/") -- on laisse juste jouer la petite animation de succès +
   * confettis un court instant avant, plutôt que de fermer
   * instantanément. Aucun appel API, aucune règle métier ici.
   */
  const onSuccess = (message: string) => {
    setSuccessMessage(message);
    confettiRef.current?.fire();
    setTimeout(() => {
      toast('success', message);
      closeLoginModal();
      navigate('/');
    }, 1100);
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setAccountNotFound(false);
    if (!selectedTenant) {
      setTenantError(true);
      setFormError('Choisissez une organisation avant de continuer.');
      return;
    }
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
        const message = error instanceof ApiError ? error.message : 'Identifiant ou mot de passe incorrect.';
        setFormError(message);
        toast('error', 'Connexion impossible', message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    if (!selectedTenant) {
      setTenantError(true);
      setFormError('Choisissez une organisation avant de continuer.');
      return;
    }
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
          toast('error', 'Inscription impossible', 'Vérifiez les champs en rouge.');
        } else {
          setFormError(error.message);
          toast('error', 'Inscription impossible', error.message);
        }
      } else {
        const message = error instanceof ApiError ? error.message : "L'inscription a échoué. Veuillez réessayer.";
        setFormError(message);
        toast('error', 'Inscription impossible', message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /** Confirmation de la proposition "aucun compte trouvé -> en créer un". */
  const handleCreateAccount = async () => {
    setFormError(null);
    if (!selectedTenant) {
      setTenantError(true);
      setFormError('Choisissez une organisation avant de continuer.');
      return;
    }
    setSubmitting(true);
    try {
      const profile = await register({ identifiant: identifiant.trim(), password });
      setAccountNotFound(false);
      onSuccess(
        `Aucun compte n'existait pour « ${identifiant.trim()} » — nous en avons créé un nouveau avec les identifiants saisis (${profile.nomAffiche}).`
      );
    } catch (error) {
      setAccountNotFound(false);
      const message = error instanceof ApiError ? error.message : 'Impossible de créer le compte pour le moment.';
      setFormError(message);
      toast('error', 'Création du compte impossible', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setFormError(null);
    setAccountNotFound(false);
    if (!selectedTenant) {
      setTenantError(true);
      setFormError('Choisissez une organisation avant de continuer.');
      return;
    }
    setSubmitting(true);
    try {
      const profile = await loginWithGoogle(credential);
      onSuccess(`Bon retour, ${profile.nomAffiche} !`);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Connexion Google impossible pour le moment.';
      setFormError(message);
      toast('error', 'Connexion Google impossible', message);
    } finally {
      setSubmitting(false);
    }
  };

  const title = mode === 'login' ? 'Connexion' : 'Créer un compte';
  const subtitle =
    mode === 'login'
      ? 'La connexion reste optionnelle — vous pouvez continuer anonymement.'
      : 'Un identifiant, un mot de passe : simple et rapide.';
  const loadingMessages =
    mode === 'login' ? ['Connexion en cours…', 'Vérification…'] : ['Création du compte…', 'Configuration du profil…'];
  const blocked = submitting || Boolean(successMessage);

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
      <AuthGlassStyles />

      <div className="civ-auth-scope relative w-full max-w-[360px] max-h-[80vh] overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl">
        {/* Fond dégradé animé, discret, contenu dans les coins arrondis de la carte */}
        <div className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-40">
          <AuthGradientBackground />
        </div>

        <button
          type="button"
          onClick={closeLoginModal}
          aria-label="Fermer"
          className="absolute top-3 right-3 z-30 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-all"
        >
          <X className="w-4.5 h-4.5" />
        </button>

        <div className="relative z-10 max-h-[80vh] overflow-y-auto px-5 py-6 sm:px-6 sm:py-7">
          <BlurFade className="w-full pr-6 pb-1 text-center">
            <h2
              id="login-modal-title"
              className="font-serif text-[26px] sm:text-[28px] font-light tracking-tight text-gray-900 dark:text-white"
            >
              {title}
            </h2>
            <p className="mt-1.5 text-[12.5px] text-gray-500 dark:text-gray-400">{subtitle}</p>
          </BlurFade>

          <BlurFade delay={0.03} className="w-full pt-4">
            <TenantSelectButton
              value={selectedTenant}
              onSelect={handleTenantSelect}
              disabled={blocked}
              hasError={tenantError}
            />
            {tenantError && <p className="mt-1 text-xs font-medium text-red-500">Choisissez une organisation pour continuer.</p>}
          </BlurFade>

          <AnimatePresence initial={false}>
            {step === 'identifiant' && (
              <motion.div
                key="providers"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="w-full overflow-hidden"
              >
                <BlurFade delay={0.05} className="w-full space-y-2.5 pt-4 pb-4">
                  <div className="civ-auth-glass-static rounded-2xl p-1">
                    <GoogleSignInButton
                      onCredential={handleGoogleCredential}
                      disabled={blocked || !selectedTenant}
                      text={mode === 'login' ? 'signin_with' : 'signup_with'}
                    />
                  </div>
                  <ComingSoonProviderButton label="ID-Gab" icon={<Fingerprint className="w-4 h-4" />} />
                  <div className="flex items-center gap-3 pt-1">
                    <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">ou</span>
                    <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                  </div>
                </BlurFade>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={mode === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="w-full space-y-1" noValidate>
            <div className={cn('relative w-full', step === 'password' && 'pt-5')}>
              <AnimatePresence>
                {step === 'password' && (
                  <motion.div
                    initial={{ y: -6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.25, delay: 0.15 }}
                    className="absolute top-0 left-4 z-10"
                  >
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                      Email ou téléphone
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className={cn('civ-auth-glass-input-wrap', fieldErrors.identifiant && 'civ-auth-glass-input--error')}>
                <div className="civ-auth-glass-input">
                  <div
                    className={cn(
                      'relative z-10 flex flex-shrink-0 items-center justify-center overflow-hidden transition-all duration-300',
                      identifiant.length > 20 && step === 'identifiant' ? 'w-0 px-0' : 'w-9 pl-2'
                    )}
                  >
                    <Mail className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  </div>
                  <input
                    id="modal_identifiant"
                    type="text"
                    value={identifiant}
                    onChange={(e) => {
                      setIdentifiant(e.target.value);
                      setAccountNotFound(false);
                    }}
                    onKeyDown={handleIdentifiantKeyDown}
                    placeholder="vous@exemple.com ou 074 12 34 56"
                    autoComplete="username"
                    required
                    disabled={blocked}
                    aria-invalid={Boolean(fieldErrors.identifiant)}
                    className="pr-2 text-sm"
                  />
                  {step === 'identifiant' && (
                    <div
                      className={cn(
                        'relative z-10 flex-shrink-0 overflow-hidden transition-all duration-300',
                        isIdentifiantFilled ? 'w-9 pr-1' : 'w-0'
                      )}
                    >
                      <GlassButton
                        type="button"
                        size="icon"
                        onClick={goToPasswordStep}
                        aria-label="Continuer"
                        contentClassName="text-gray-600 dark:text-gray-300"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </GlassButton>
                    </div>
                  )}
                </div>
              </div>
              {fieldErrors.identifiant && <p className="mt-1 text-xs font-medium text-red-500">{fieldErrors.identifiant}</p>}
            </div>

            <AnimatePresence initial={false}>
              {step === 'password' && (
                <motion.div
                  key="password-step"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="w-full overflow-hidden"
                >
                  <BlurFade className="w-full pt-4">
                    <div className="relative w-full pt-5">
                      <AnimatePresence>
                        {password.length > 0 && (
                          <motion.div
                            initial={{ y: -6, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-0 left-4 z-10"
                          >
                            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                              Mot de passe
                            </label>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className={cn('civ-auth-glass-input-wrap', fieldErrors.password && 'civ-auth-glass-input--error')}>
                        <div className="civ-auth-glass-input">
                          <div className="relative z-10 flex w-9 flex-shrink-0 items-center justify-center pl-2">
                            {password.length > 0 ? (
                              <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                tabIndex={-1}
                                className="rounded-full p-1.5 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
                                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            ) : (
                              <Lock className="h-4 w-4 flex-shrink-0 text-gray-400" />
                            )}
                          </div>
                          <input
                            ref={passwordInputRef}
                            id="modal_password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              setAccountNotFound(false);
                            }}
                            placeholder="••••••••"
                            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            required
                            disabled={blocked}
                            aria-invalid={Boolean(fieldErrors.password)}
                            className="pr-2 text-sm"
                          />
                          <div className="relative z-10 w-9 flex-shrink-0 pr-1">
                            <GlassButton
                              type="submit"
                              size="icon"
                              disabled={blocked}
                              aria-label={mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                              contentClassName="text-gray-600 dark:text-gray-300"
                            >
                              {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                            </GlassButton>
                          </div>
                        </div>
                      </div>
                      {fieldErrors.password && <p className="mt-1 text-xs font-medium text-red-500">{fieldErrors.password}</p>}
                    </div>

                    <button
                      type="button"
                      onClick={goBackToIdentifiantStep}
                      disabled={blocked}
                      className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Retour
                    </button>
                  </BlurFade>
                </motion.div>
              )}
            </AnimatePresence>

            {formError && (
              <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-500 dark:bg-red-950/30">
                {formError}
              </p>
            )}

            {accountNotFound && (
              <div
                role="alert"
                className="mt-3 space-y-2.5 rounded-xl border border-[#5B4DFF]/30 bg-[#5B4DFF]/5 px-3.5 py-3 dark:bg-[#5B4DFF]/10"
              >
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
                    disabled={blocked}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#5B4DFF] hover:bg-[#5B4DFF]/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs py-2.5 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Créer mon compte
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountNotFound(false)}
                    disabled={blocked}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold text-xs px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </form>

          <p className="mt-5 text-center text-[12.5px] text-gray-500 dark:text-gray-400">
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
                    setStep('identifiant');
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
                    setStep('identifiant');
                  }}
                  className="font-bold text-[#5B4DFF] hover:underline"
                >
                  Se connecter
                </button>
              </>
            )}
          </p>

          {/* Distinct de "Créer un compte"/"Créer mon compte" ci-dessus :
              rejoindre une organisation EXISTANTE (le sélecteur en haut
              du popup) n'est pas la même action que fonder une
              organisation qui n'existe pas encore -- voir
              CreerOrganisationPage.tsx (POST /tenants/v1/). */}
          <p className="mt-1.5 text-center text-[11.5px] text-gray-400 dark:text-gray-500">
            Votre organisation n'existe pas encore ?{' '}
            <button
              type="button"
              onClick={() => {
                closeLoginModal();
                navigate('/organisations/creer');
              }}
              className="font-bold text-[#5B4DFF] hover:underline"
            >
              Créez-la
            </button>
          </p>
        </div>

        {/* Confettis -- au-dessus de tout, y compris le voile de succès ci-dessous */}
        <MiniConfetti ref={confettiRef} className="pointer-events-none absolute inset-0 z-50 h-full w-full" />

        {/* Voile de chargement / succès -- pas de durée figée : reste
            affiché tant que `submitting` est vrai (appel réseau réel),
            puis bascule sur le message de succès pendant la pause
            avant fermeture (voir onSuccess ci-dessus). */}
        <AnimatePresence>
          {blocked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 rounded-2xl bg-white/85 px-6 text-center backdrop-blur-md dark:bg-gray-900/85"
            >
              {successMessage ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <PartyPopper className="h-10 w-10 text-green-500" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{successMessage}</p>
                </motion.div>
              ) : (
                <TextLoop interval={1.3} className="flex flex-col items-center gap-3">
                  {loadingMessages.map((msg) => (
                    <div key={msg} className="flex flex-col items-center gap-3">
                      <Loader className="h-8 w-8 animate-spin text-[#5B4DFF]" />
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{msg}</p>
                    </div>
                  ))}
                </TextLoop>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
