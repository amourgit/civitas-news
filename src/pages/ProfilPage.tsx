import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useUiStore } from '../store/ui.store';
import {
  User,
  Award,
  CheckSquare,
  MessageSquare,
  Settings,
  Lock,
  Plus,
  Vote,
  FileText,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Search,
  Share2,
  Calendar,
  Building,
  Mail,
  Sparkles,
  ExternalLink,
  Clock,
  ThumbsUp,
  Eye,
  LogOut,
  Sliders,
  Check,
  UserCheck,
  Building2,
  Phone,
  HelpCircle,
  X,
  Sun,
  Moon,
  Bell,
} from 'lucide-react';
import { toast } from '../hooks/useToast';
import { ConfirmDialog } from '../components/backoffice/ConfirmDialog';

export default function ProfilPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();
  const { theme, toggleTheme, openLoginModal } = useUiStore();

  const [activeTab, setActiveTab] = useState<'activite' | 'votes' | 'sujets' | 'info' | 'badges'>('activite');
  const [rightSearchQuery, setRightSearchQuery] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Ne rejette jamais (voir useAuthStore().logout() dans auth.store.ts) :
      // même si la révocation serveur échoue, la session locale est
      // toujours effacée -- donc pas de branche d'erreur ici.
      await logout(); // révoque le token côté serveur (POST /token/v1/logout/) puis tokenStore.clear()
      toast('success', 'Déconnexion effectuée.', 'À bientôt sur CIVITAS !');
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
      navigate('/');
    }
  };

  // Check if user has rank/grade permission to create topics
  const canCreateTopics = user.role === 'etudiant' || user.role === 'administrateur' || user.role === 'moderateur' || user.role === 'organisation';

  // Mock activity history data
  const activityLogs = [
    {
      id: 'act-1',
      type: 'commentaire',
      title: 'A commenté sur le sujet "Réforme du Transport Étudiant 2026"',
      snippet: '"Il est essentiel d\'augmenter les fréquences de bus aux heures de pointe."',
      date: 'Il y a 25 minutes',
      likes: 14,
      link: '/sujets/reforme-transport-etudiant-2026',
    },
    {
      id: 'act-2',
      type: 'vote',
      title: 'A voté POUR sur la consultation "Plan Numérique Campus"',
      snippet: 'Choix sélectionné : Option B — Déploiement Wifi 6 haut débit prioritaire.',
      date: 'Il y a 3 heures',
      likes: 8,
      link: '/sujets/consultation-plan-numerique-campus',
    },
    {
      id: 'act-3',
      type: 'soutien',
      title: 'A apporté son soutien à la proposition "Subvention Restauration"',
      snippet: 'Appel civique avec +340 signatures obtenues.',
      date: 'Hier à 14:30',
      likes: 42,
      link: '/sujets/attribution-bourses-etudiantes-excellence',
    },
    {
      id: 'act-4',
      type: 'badge',
      title: 'A débloqué le Badge "Débatteur Actif"',
      snippet: 'Niveau 2 atteint suite à +50 contributions civiques vérifiées.',
      date: 'Il y a 3 jours',
      likes: 19,
      link: '#',
    },
  ];

  // Mock voting history data
  const voteHistory = [
    {
      id: 'vh-1',
      sujet: 'Réforme du Transport Étudiant 2026',
      choix: 'POUR (Abonnement unique gratuit)',
      date: '01 Août 2026',
      statut: 'Scrutin En Cours',
      poidsVote: '1 Vote (Grade Étudiant)',
      lien: '/sujets/reforme-transport-etudiant-2026',
    },
    {
      id: 'vh-2',
      sujet: 'Consultation Plan Numérique Campus',
      choix: 'POUR (Option B - Wifi 6)',
      date: '28 Juillet 2026',
      statut: 'Adopté à 78%',
      poidsVote: '1 Vote (Grade Étudiant)',
      lien: '/sujets/consultation-plan-numerique-campus',
    },
    {
      id: 'vh-3',
      sujet: 'Attribution Bourses d\'Excellence 2026-2027',
      choix: 'POUR (Extension des critères de revenus)',
      date: '15 Juillet 2026',
      statut: 'Clôturé',
      poidsVote: '1 Vote (Grade Étudiant)',
      lien: '/sujets/attribution-bourses-etudiantes-excellence',
    },
    {
      id: 'vh-4',
      sujet: 'Budget participatif équipement laboratoires',
      choix: 'ABSTENTION',
      date: '02 Juin 2026',
      statut: 'Validé',
      poidsVote: '1 Vote (Grade Étudiant)',
      lien: '#',
    },
  ];

  // Mock user created topics
  const userCreatedTopics = [
    {
      id: 'created-1',
      titre: 'Aménagement des horaires de bibliothèques en période d\'examens',
      categorie: 'Vie Étudiante',
      date: '12 Juillet 2026',
      statut: 'Actif • 234 Votes',
      vues: 1420,
      commentaires: 56,
      lien: '/sujets/consultation-plan-numerique-campus',
    },
    {
      id: 'created-2',
      titre: 'Installation de bornes de recharge solaires sur les campus',
      categorie: 'Infrastructure',
      date: '04 Juin 2026',
      statut: 'Adopté • 580 Votes',
      vues: 3100,
      commentaires: 112,
      lien: '/sujets/reforme-transport-etudiant-2026',
    },
  ];

  // Mock Trends / Hot topics for Right Widget (Matching Image 1)
  const hotTopics = [
    { id: 1, name: 'Transport Universitaire 2026', handle: '#TransportCivique', votes: '12.4K votes' },
    { id: 2, name: 'Bourses d\'Excellence Kinshasa', handle: '#Bourses2026', votes: '8.9K votes' },
    { id: 3, name: 'Plan Numérique Campus', handle: '#CampusConnecte', votes: '5.2K votes' },
    { id: 4, name: 'Budget Équipements Labos', handle: '#InnovationEducation', votes: '3.1K votes' },
  ];

  const handleShareProfile = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast('success', 'Lien du profil copié dans le presse-papier !');
    } else {
      toast('info', 'Profil CIVITAS de ' + user.nomAffiche);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-2 py-0 sm:py-4 space-y-4 pb-24">
      {/* Outer Main Wrapper - STRICTLY FLAT (rounded-none) per user prompt */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 sm:gap-6 items-start">

        {/* ================= MAIN COLUMN (COL 8 in Desktop, Full width in Mobile) ================= */}
        <div className="lg:col-span-8 space-y-4">

          {/* Banner & Cover Profile Card - STRICTLY NO ROUNDED CORNERS (rounded-none) */}
          <div className="bg-white dark:bg-[#1A1F4D] border-b sm:border border-gray-200 dark:border-gray-800 rounded-none shadow-xs overflow-hidden">
            {/* Cover Banner (Sky Blue/Cosmic Gradient matching Image 1 & Image 2) */}
            <div className="relative h-36 sm:h-48 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 dark:from-indigo-950 dark:via-purple-900 dark:to-slate-900 overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),transparent)] pointer-events-none" />
              
              {/* Back & Share Buttons on Cover */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={handleShareProfile}
                  className="p-2 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md text-white transition-all"
                  title="Partager le profil"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <Link
                  to="/parametres"
                  className="px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-gray-900 dark:bg-gray-900/90 dark:hover:bg-gray-900 dark:text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5 text-[#5B4DFF]" />
                  <span>Paramètres</span>
                </Link>
                {/* Déconnexion -- visible directement sur la bannière (pas
                    besoin d'ouvrir l'onglet "Infos & Rangs" pour la trouver,
                    voir aussi le bouton équivalent plus bas). Même
                    handleLogout, même flux (révocation serveur +
                    tokenStore.clear()) -- aucune logique dupliquée. */}
                {isAuthenticated && (
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="p-2 rounded-full bg-black/30 hover:bg-rose-600/90 backdrop-blur-md text-white transition-all"
                    title="Se déconnecter"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Profile Header Details (Avatar overlapping banner) */}
            <div className="px-4 sm:px-6 pb-5 pt-0 relative">
              <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-3 -mt-14 sm:-mt-16 mb-4">
                {/* Avatar with Circular Border */}
                <div className="relative shrink-0">
                  <img
                    src={
                      user.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                    }
                    alt={user.nomAffiche}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white dark:border-[#1A1F4D] shadow-lg bg-gray-100 dark:bg-gray-800"
                  />
                  {isAuthenticated && (
                    <div
                      className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-[#1A1F4D] shadow-xs"
                      title="Compte Vérifié Civique"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Grade / rôle actuel — en lecture seule, déterminé par le backend */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2 sm:mt-0">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mr-1">
                    Grade :
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                      user.role === 'administrateur' || user.role === 'moderateur'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : user.role === 'anonyme'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-[#5B4DFF] text-white shadow-xs'
                    }`}
                  >
                    {user.role === 'etudiant' && 'Étudiant'}
                    {user.role === 'moderateur' && 'Modérateur'}
                    {user.role === 'administrateur' && 'Administrateur'}
                    {user.role === 'organisation' && 'Organisation'}
                    {user.role === 'anonyme' && 'Anonyme'}
                  </span>
                  {user.role === 'anonyme' && (
                    <button
                      type="button"
                      onClick={openLoginModal}
                      className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-all"
                    >
                      Se connecter
                    </button>
                  )}
                </div>
              </div>

              {/* User Identity Info */}
              <div className="text-center sm:text-left space-y-1">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white font-display tracking-tight flex items-center justify-center sm:justify-start gap-2">
                  {user.nomAffiche}
                  {user.role === 'administrateur' && (
                    <ShieldCheck className="w-5 h-5 text-purple-500 fill-purple-100 dark:fill-purple-950" />
                  )}
                </h1>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  @{user.username} • {user.etablissement || 'Plateforme Nationale Civique'}
                </p>

                {/* Badges list */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-2">
                  {user.badges && user.badges.length > 0 ? (
                    user.badges.map((b) => (
                      <span
                        key={b.id}
                        className="px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 text-[11px] font-bold flex items-center gap-1"
                        title={b.description}
                      >
                        <span>{b.icone}</span>
                        <span>{b.nom}</span>
                      </span>
                    ))
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 text-[11px] font-medium">
                      Membre Citoyen Anonyme
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Bar (Exact layout matching Image 1 & Image 2) */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 text-center">
                <div className="p-2 rounded-none bg-gray-50/50 dark:bg-white/[0.02]">
                  <div className="text-lg sm:text-xl font-black text-[#5B4DFF] dark:text-purple-300 font-display">
                    {user.stats?.contributions || 14}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                    Contributions
                  </div>
                </div>

                <div className="p-2 rounded-none bg-gray-50/50 dark:bg-white/[0.02]">
                  <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-display">
                    {user.stats?.votes || 38}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                    Votes Civiques
                  </div>
                </div>

                <div className="p-2 rounded-none bg-gray-50/50 dark:bg-white/[0.02]">
                  <div className="text-lg sm:text-xl font-black text-amber-500 font-display">
                    {user.stats?.commentaires || 42}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                    Commentaires
                  </div>
                </div>

                <div className="hidden sm:block p-2 rounded-none bg-gray-50/50 dark:bg-white/[0.02]">
                  <div className="text-lg sm:text-xl font-black text-cyan-500 font-display">
                    359K
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                    Impact Citoyen
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Options & Tabs Header - STRICTLY NO ROUNDED CORNERS (rounded-none) */}
          <div className="bg-white dark:bg-[#1A1F4D] border-b sm:border border-gray-200 dark:border-gray-800 rounded-none shadow-xs">
            <div className="flex items-center overflow-x-auto no-scrollbar border-b border-gray-100 dark:border-gray-800 px-2 text-xs sm:text-sm font-bold">
              <button
                onClick={() => setActiveTab('activite')}
                className={`py-3 px-3 sm:px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'activite'
                    ? 'border-[#5B4DFF] text-[#5B4DFF] dark:text-purple-300 font-black'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                Journal d'activité
              </button>

              <button
                onClick={() => setActiveTab('votes')}
                className={`py-3 px-3 sm:px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'votes'
                    ? 'border-[#5B4DFF] text-[#5B4DFF] dark:text-purple-300 font-black'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Vote className="w-4 h-4" />
                Historique des votes
              </button>

              <button
                onClick={() => setActiveTab('sujets')}
                className={`py-3 px-3 sm:px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'sujets'
                    ? 'border-[#5B4DFF] text-[#5B4DFF] dark:text-purple-300 font-black'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Plus className="w-4 h-4" />
                Sujets créés
                {canCreateTopics && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold">
                    {userCreatedTopics.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('info')}
                className={`py-3 px-3 sm:px-4 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'info'
                    ? 'border-[#5B4DFF] text-[#5B4DFF] dark:text-purple-300 font-black'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                Infos & Rangs
              </button>
            </div>

            {/* Tab Content Display - STRICTLY NO ROUNDED CORNERS (rounded-none) */}
            <div className="p-4 sm:p-5">
              {/* --- TAB 1: JOURNAL D'ACTIVITÉ --- */}
              {activeTab === 'activite' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 font-display">
                      Chronologie des interactions civiques
                    </h2>
                    <span className="text-xs font-bold text-[#5B4DFF]">4 activités récentes</span>
                  </div>

                  <div className="space-y-3">
                    {activityLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 bg-gray-50/60 dark:bg-[#121638] border border-gray-100 dark:border-gray-800/80 rounded-none space-y-2 hover:border-gray-200 dark:hover:border-gray-700 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {log.type === 'commentaire' && (
                              <MessageSquare className="w-4 h-4 text-blue-500 shrink-0" />
                            )}
                            {log.type === 'vote' && <Vote className="w-4 h-4 text-emerald-500 shrink-0" />}
                            {log.type === 'soutien' && <ThumbsUp className="w-4 h-4 text-purple-500 shrink-0" />}
                            {log.type === 'badge' && <Award className="w-4 h-4 text-amber-500 shrink-0" />}
                            <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                              {log.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-medium text-gray-400 shrink-0">{log.date}</span>
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-300 italic pl-6">
                          {log.snippet}
                        </p>

                        <div className="flex items-center justify-between pt-1 pl-6 text-[11px]">
                          <span className="text-gray-400 font-medium">❤️ {log.likes} réactions</span>
                          {log.link !== '#' && (
                            <Link
                              to={log.link}
                              className="font-bold text-[#5B4DFF] hover:underline flex items-center gap-1"
                            >
                              Consulter <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* --- TAB 2: HISTORIQUE DES VOTES --- */}
              {activeTab === 'votes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 font-display">
                      Registre confidentiel des suffrages émis
                    </h2>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Vérifié sur Blockchain Civique
                    </span>
                  </div>

                  <div className="space-y-3">
                    {voteHistory.map((v) => (
                      <div
                        key={v.id}
                        className="p-3.5 bg-gray-50/60 dark:bg-[#121638] border border-gray-100 dark:border-gray-800/80 rounded-none space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Link
                            to={v.lien}
                            className="text-xs font-extrabold text-gray-900 dark:text-white hover:text-[#5B4DFF] transition-colors"
                          >
                            {v.sujet}
                          </Link>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">
                            {v.statut}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-700 dark:text-gray-200">
                              Votre Vote :
                            </span>
                            <span className="font-extrabold text-[#5B4DFF] bg-purple-50 dark:bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                              {v.choix}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400 font-medium">{v.date}</span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-gray-200/50 dark:border-gray-800/50 text-[10px] text-gray-400">
                          <span>Poids du vote: {v.poidsVote}</span>
                          <Link to={v.lien} className="font-bold text-[#5B4DFF] hover:underline">
                            Voir résultats officiels →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* --- TAB 3: SUJETS CRÉÉS --- */}
              {activeTab === 'sujets' && (
                <div className="space-y-4">
                  {canCreateTopics ? (
                    <>
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                        <div>
                          <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 font-display">
                            Sujets & Consultations publiés
                          </h2>
                          <p className="text-[11px] text-gray-400">
                            Autorisation active grâce à votre Grade Civique ({user.role.toUpperCase()})
                          </p>
                        </div>
                        <button
                          onClick={() => navigate('/creer-sujet')}
                          className="px-3 py-1.5 rounded-xl bg-[#5B4DFF] hover:bg-[#5B4DFF]/90 text-white text-xs font-extrabold flex items-center gap-1 shadow-xs transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" /> Créer un sujet
                        </button>
                      </div>

                      <div className="space-y-3">
                        {userCreatedTopics.map((topic) => (
                          <div
                            key={topic.id}
                            className="p-3.5 bg-gray-50/60 dark:bg-[#121638] border border-gray-100 dark:border-gray-800/80 rounded-none space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold">
                                {topic.categorie}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium">{topic.date}</span>
                            </div>

                            <Link
                              to={topic.lien}
                              className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white hover:text-[#5B4DFF] transition-colors block"
                            >
                              {topic.titre}
                            </Link>

                            <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
                              <span className="font-bold text-emerald-600">{topic.statut}</span>
                              <div className="flex items-center gap-3">
                                <span>👁️ {topic.vues} vues</span>
                                <span>💬 {topic.commentaires} retours</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    /* Locked State for Users without Creation Permission */
                    <div className="p-6 text-center bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/80 rounded-none space-y-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto font-bold">
                        <Lock className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-extrabold text-amber-900 dark:text-amber-200 font-display">
                        Création de sujets civiques restreinte
                      </h3>
                      <p className="text-xs text-amber-800 dark:text-amber-300 max-w-md mx-auto leading-relaxed">
                        La publication directe de propositions nécessite un Grade Civique vérifié (Étudiant inscrit, Modérateur ou Délégué d'établissement).
                      </p>
                      <div className="pt-2 flex flex-wrap justify-center gap-2">
                        <button
                          type="button"
                          onClick={openLoginModal}
                          className="px-4 py-2 rounded-xl bg-[#5B4DFF] hover:bg-[#5B4DFF]/90 text-white text-xs font-bold shadow-xs transition-all"
                        >
                          Se connecter avec un compte vérifié
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* --- TAB 4: INFORMATIONS PERSONNELLES & RANGS --- */}
              {activeTab === 'info' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 font-display">
                      Données d'Identité & Sécurité Civique
                    </h2>
                    <span className="text-xs font-bold text-gray-400">Strictement Confidentiel</span>
                  </div>

                  {/* Personal Info Grid matching Image 2 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-gray-50 dark:bg-[#121638] border border-gray-200/60 dark:border-gray-800 rounded-none space-y-1">
                      <div className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                        <User className="w-3 h-3 text-[#5B4DFF]" /> Nom Officiel
                      </div>
                      <div className="font-extrabold text-gray-900 dark:text-white">{user.nomAffiche}</div>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-[#121638] border border-gray-200/60 dark:border-gray-800 rounded-none space-y-1">
                      <div className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                        <Mail className="w-3 h-3 text-[#5B4DFF]" /> Email Authentifié
                      </div>
                      <div className="font-extrabold text-gray-900 dark:text-white">
                        {user.email || 'citoyen.anonyme@civitas.org'}
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-[#121638] border border-gray-200/60 dark:border-gray-800 rounded-none space-y-1">
                      <div className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-[#5B4DFF]" /> Établissement Rattaché
                      </div>
                      <div className="font-extrabold text-gray-900 dark:text-white">
                        {user.etablissement || 'Non renseigné'}
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-[#121638] border border-gray-200/60 dark:border-gray-800 rounded-none space-y-1">
                      <div className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#5B4DFF]" /> Grade / Rôle Actuel
                      </div>
                      <div className="font-extrabold text-purple-600 dark:text-purple-300 uppercase">
                        {user.role}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 flex flex-wrap gap-2">
                    <Link
                      to="/parametres"
                      className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-extrabold hover:opacity-90 transition-all"
                    >
                      Modifier mes données
                    </Link>
                    {isAuthenticated && (
                      <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Se déconnecter
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDEBAR WIDGET COLUMN (COL 4 Desktop - Exact match Image 1) ================= */}
        <div className="lg:col-span-4 space-y-4 hidden lg:block">

          {/* Search Box - Matches Top Right Search Image 1 */}
          <div className="bg-white dark:bg-[#1A1F4D] p-3 border border-gray-200 dark:border-gray-800 rounded-none shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={rightSearchQuery}
                onChange={(e) => setRightSearchQuery(e.target.value)}
                placeholder="Rechercher des sujets civiques..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-[#121638] text-xs text-gray-900 dark:text-white placeholder-gray-400 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5B4DFF]/50"
              />
            </div>
          </div>

          {/* Hot Topics Widget - Matches "Hot topics" in Image 1 */}
          <div className="bg-white dark:bg-[#1A1F4D] p-4 border border-gray-200 dark:border-gray-800 rounded-none shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white font-display border-b border-gray-100 dark:border-gray-800 pb-2">
              Hot Topics Civiques
            </h3>

            <div className="space-y-3">
              {hotTopics.map((ht) => (
                <div key={ht.id} className="flex items-center justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 dark:text-white truncate">{ht.name}</div>
                    <div className="text-[10px] text-gray-400">{ht.handle}</div>
                  </div>
                  <Link
                    to="/sujets"
                    className="px-3 py-1 rounded-full border border-[#5B4DFF] text-[#5B4DFF] dark:text-purple-300 text-[11px] font-extrabold hover:bg-[#5B4DFF] hover:text-white transition-all shrink-0"
                  >
                    Lire
                  </Link>
                </div>
              ))}
            </div>

            <Link
              to="/sujets"
              className="block pt-2 text-center text-xs font-bold text-[#5B4DFF] hover:underline"
            >
              Voir plus de sujets...
            </Link>
          </div>

          {/* Trends For You Widget - Matches "Trends for you" Image 1 */}
          <div className="bg-white dark:bg-[#1A1F4D] p-4 border border-gray-200 dark:border-gray-800 rounded-none shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white font-display">
                Tendances Recommandées
              </h3>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-gray-400 font-semibold">1. Populaire en RDC</span>
                <div className="font-bold text-gray-900 dark:text-white hover:text-[#5B4DFF] cursor-pointer">
                  #NouveauxProgrammesUniversitaires
                </div>
                <div className="text-[10px] font-medium text-gray-400">14.2K Citoyens engagés</div>
              </div>

              <div className="space-y-0.5 pt-2 border-t border-gray-100/60 dark:border-gray-800/60">
                <span className="text-[10px] text-gray-400 font-semibold">2. Éducation & Numérique</span>
                <div className="font-bold text-gray-900 dark:text-white hover:text-[#5B4DFF] cursor-pointer">
                  #AideCiviqueEtudiante
                </div>
                <div className="text-[10px] font-medium text-gray-400">8.9K Votes enregistrés</div>
              </div>

              <div className="space-y-0.5 pt-2 border-t border-gray-100/60 dark:border-gray-800/60">
                <span className="text-[10px] text-gray-400 font-semibold">3. Transport & Villes</span>
                <div className="font-bold text-gray-900 dark:text-white hover:text-[#5B4DFF] cursor-pointer">
                  #PistesCyclablesKinshasa
                </div>
                <div className="text-[10px] font-medium text-gray-400">3.4K Citoyens engagés</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Se déconnecter"
        description="Vous serez déconnecté de votre session sur cet appareil. Vous pourrez vous reconnecter à tout moment."
        confirmLabel="Se déconnecter"
        isLoading={isLoggingOut}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
}
