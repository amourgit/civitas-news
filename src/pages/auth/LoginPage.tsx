import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { toast } from '../../hooks/useToast';
import {
  Shield,
  Sparkles,
  Mail,
  Lock,
  User,
  CheckCircle2,
  LogOut,
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck,
  Globe,
  Building,
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isAnonymous,
    loginWithGoogle,
    loginWithEmail,
    loginAsStudent,
    loginAsAdmin,
    loginAsAnonymous,
    logout,
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'google' | 'email' | 'roles'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Google OAuth simulation modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleName, setCustomGoogleName] = useState('Samuel Nzila');
  const [customGoogleEmail, setCustomGoogleEmail] = useState('samuel.nzila@gmail.com');

  const handleGoogleLoginSubmit = (nameToUse?: string, emailToUse?: string) => {
    setIsSubmitting(true);
    setTimeout(() => {
      const loggedUser = loginWithGoogle({
        name: nameToUse || customGoogleName,
        email: emailToUse || customGoogleEmail,
        picture:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      });
      setIsSubmitting(false);
      setShowGoogleModal(false);
      toast(
        'success',
        'Connexion Google réussie !',
        `Bienvenue ${loggedUser.nomAffiche}. Vos actions seront désormais enregistrées à votre nom.`
      );
      navigate('/');
    }, 600);
  };

  const handleEmailLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast('warning', 'Champs requis', 'Veuillez saisir votre email et votre mot de passe.');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      const loggedUser = loginWithEmail({ email });
      setIsSubmitting(false);
      toast(
        'success',
        'Connexion effectuée !',
        `Ravi de vous revoir ${loggedUser.nomAffiche}. Tout votre historique est associé à votre compte.`
      );
      navigate('/');
    }, 500);
  };

  const handleQuickStudentLogin = () => {
    loginAsStudent();
    toast(
      'success',
      'Connecté en tant qu’Étudiante !',
      'Vos contributions sont maintenant signées Amina K. (Étudiante).'
    );
    navigate('/');
  };

  const handleQuickAdminLogin = () => {
    loginAsAdmin();
    toast(
      'success',
      'Espace Administration',
      'Connecté sous le profil Administrateur CIVITAS.'
    );
    navigate('/admin');
  };

  const handleAnonSwitch = () => {
    loginAsAnonymous();
    toast(
      'info',
      'Mode Anonyme Activé',
      'Vos actions (commentaires, votes) seront désormais attribuées au "Citoyen Anonyme".'
    );
  };

  const handleLogout = () => {
    logout();
    toast('info', 'Déconnexion', 'Vous naviguez désormais en utilisateur anonyme.');
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 py-6 sm:py-10 px-3 sm:px-4">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-white via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-800/80 dark:to-gray-900 mx-auto flex items-center justify-center text-white font-extrabold text-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <img src="/images/logo-civitas-color-simple-removebg-preview.png" alt="CIVITAS Logo" className="w-10 h-10 object-contain drop-shadow-sm" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-display">
            Connexion & Identité Civique
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1">
            Connectez-vous avec Google ou par email pour signer vos consultations publiques, ou participez en mode anonyme.
          </p>
        </div>
      </div>

      {/* Current Active User Status Card */}
      <div className="bg-gradient-to-r from-purple-900/10 via-blue-900/10 to-indigo-900/10 dark:from-purple-950/40 dark:via-blue-950/40 dark:to-indigo-950/40 border border-purple-200/60 dark:border-purple-800/50 p-4 sm:p-5 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar src={user.avatar} name={user.nomAffiche} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Statut actuel :
                </span>
                {isAuthenticated ? (
                  <Badge variant="purple" size="sm">
                    <UserCheck className="w-3 h-3 inline mr-1" />
                    Connecté à votre nom
                  </Badge>
                ) : (
                  <Badge variant="outline" size="sm">
                    <Sparkles className="w-3 h-3 inline mr-1 text-amber-500" />
                    Utilisateur Anonyme
                  </Badge>
                )}
              </div>
              <p className="text-sm font-extrabold text-gray-900 dark:text-white mt-0.5">
                {user.nomAffiche} {user.email ? `(${user.email})` : ''}
              </p>
            </div>
          </div>

          {isAuthenticated ? (
            <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0 text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          ) : (
            <span className="text-[11px] text-gray-500 dark:text-gray-400 hidden sm:block italic">
              Actions attribuées à "Citoyen Anonyme"
            </span>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-purple-200/40 dark:border-purple-800/30 text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#5B4DFF] shrink-0 mt-0.5" />
          <span>
            {isAuthenticated ? (
              <>
                <strong>Règle d'attribution active :</strong> Tous vos commentaires, propositions de sujet et votes sont enregistrés sous votre nom <strong>{user.nomAffiche}</strong>.
              </>
            ) : (
              <>
                <strong>Mode Anonyme par défaut :</strong> Vous n'êtes pas connecté. Toutes vos actions sur la plateforme seront retenues et enregistrées sous un profil anonyme citoyen.
              </>
            )}
          </span>
        </div>
      </div>

      {/* Main Auth Form Container */}
      <div className="bg-white dark:bg-[#1A1F4D] rounded-3xl p-5 sm:p-7 border border-gray-100 dark:border-gray-800 shadow-xl space-y-6">
        {/* Navigation Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800/70 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-white dark:bg-[#151940] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            Google Auth
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'email'
                ? 'bg-white dark:bg-[#151940] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-[#5B4DFF]" />
            Email / Mot de passe
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'roles'
                ? 'bg-white dark:bg-[#151940] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-amber-500" />
            Comptes Démos
          </button>
        </div>

        {/* Tab 1: Google OAuth */}
        {activeTab === 'google' && (
          <div className="space-y-4">
            <div className="text-center space-y-2 py-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 text-blue-600 mb-1">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                Connexion rapide via Google
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Utilisez votre compte Google institutionnel ou personnel pour vous authentifier de manière sécurisée et instantanée.
              </p>
            </div>

            {/* Google Sign-In Primary Button */}
            <button
              type="button"
              onClick={() => setShowGoogleModal(true)}
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-white font-extrabold text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 group"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Se connecter avec Google</span>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform ml-auto" />
            </button>

            {/* Quick Google Instant Account Presets */}
            <div className="pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2 text-center">
                Comptes Google en 1 Clic :
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleGoogleLoginSubmit('Samuel Nzila (Google)', 'samuel.nzila@gmail.com')}
                  className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-gray-200 dark:border-gray-700 text-left transition-colors flex items-center gap-2.5"
                >
                  <Avatar name="Samuel Nzila" size="sm" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Samuel Nzila</p>
                    <p className="text-[10px] text-gray-400 truncate">samuel.nzila@gmail.com</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleGoogleLoginSubmit('Marie Kalala (Google)', 'marie.kalala@gmail.com')}
                  className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-gray-200 dark:border-gray-700 text-left transition-colors flex items-center gap-2.5"
                >
                  <Avatar name="Marie Kalala" size="sm" />
                  <div className="truncate">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">Marie Kalala</p>
                    <p className="text-[10px] text-gray-400 truncate">marie.kalala@gmail.com</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Standard Email / Password Form */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@universite-ou-organisation.cd"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-[#5B4DFF] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-[#5B4DFF] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isSubmitting}
            >
              Se Connecter avec mon Email
            </Button>
          </form>
        )}

        {/* Tab 3: Quick Roles Presets */}
        {activeTab === 'roles' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Choisissez un rôle pré-configuré pour tester la plateforme avec des privilèges spécifiques :
            </p>

            <Button
              variant="primary"
              size="md"
              className="w-full justify-start"
              icon={<User className="w-4 h-4" />}
              onClick={handleQuickStudentLogin}
            >
              Amina K. (Compte Étudiante & Mutuelle)
            </Button>

            <Button
              variant="secondary"
              size="md"
              className="w-full justify-start"
              icon={<Shield className="w-4 h-4 text-amber-500" />}
              onClick={handleQuickAdminLogin}
            >
              Administrateur CIVITAS (Backoffice & Modération)
            </Button>
          </div>
        )}

        {/* Separator */}
        <div className="relative my-4 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <span className="relative px-3 bg-white dark:bg-[#1A1F4D] text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            Ou continuer sans connexion
          </span>
        </div>

        {/* Anonymous Mode Option Button */}
        <Button
          variant="outline"
          size="md"
          className="w-full border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
          icon={<Sparkles className="w-4 h-4 text-[#5B4DFF]" />}
          onClick={() => {
            handleAnonSwitch();
            navigate('/');
          }}
        >
          Continuer en Mode Anonyme (Citoyen)
        </Button>
      </div>

      {/* Footer Info & Registration Link */}
      <div className="text-center space-y-2 text-xs text-gray-400">
        <p>
          Pas encore inscrit ?{' '}
          <button
            type="button"
            onClick={() => setShowGoogleModal(true)}
            className="text-[#5B4DFF] dark:text-sky-400 font-bold hover:underline"
          >
            Inscrivez-vous via Google ou par email
          </button>
        </p>
        <p className="text-[11px] text-gray-400">
          Les données transmises sont protégées conformément au règlement national de protection de la vie privée.
        </p>
      </div>

      {/* Interactive Google Authentication Popup Modal */}
      <Modal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        title={
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.3 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Se connecter avec Google - CIVITAS</span>
          </div>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-xs text-gray-500 dark:text-gray-300">
            Sélectionnez un compte Google ou saisissez votre nom et email pour valider l'authentification OAuth :
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Nom complet affiché
              </label>
              <input
                type="text"
                value={customGoogleName}
                onChange={(e) => setCustomGoogleName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Adresse email Google (@gmail.com)
              </label>
              <input
                type="email"
                value={customGoogleEmail}
                onChange={(e) => setCustomGoogleEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowGoogleModal(false)}>
              Annuler
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={() => handleGoogleLoginSubmit()}
            >
              Confirmer l'authentification Google
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
