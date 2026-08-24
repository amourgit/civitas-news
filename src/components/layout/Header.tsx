import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Sun, Moon, HelpCircle, ChevronLeft, ChevronRight, Sparkles, LogIn, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUiStore } from '../../store/ui.store';
import { useNotificationsStore } from '../../store/notifications.store';
import { useAuthStore } from '../../store/auth.store';
import { usePermissions } from '../../lib/permissions/usePermissions';
import { PERMISSIONS } from '../../lib/permissions/permissions.catalog';
import topbarPatternImg from '../../assets/images/topbar_pattern_1785532678470.jpg';

const CAROUSEL_INFO = [
  {
    id: '1',
    badge: '⚡ FLASH INFO',
    badgeBg: 'bg-rose-500/90 text-white',
    text: 'Modernisation Universitaire : Déploiement du réseau haut débit & équipements numériques dans toutes les provinces.',
    link: '/news/news-1-modernisation-universitaire-rdc-2026',
  },
  {
    id: '2',
    badge: '📊 SONDAGE ACTIF',
    badgeBg: 'bg-amber-500/90 text-white',
    text: 'Budget Participatif 2026 : Donnez votre voix pour les priorités régionales et universitaires.',
    link: '/sondages/sondage-1/focus',
  },
  {
    id: '3',
    badge: '📢 À LA UNE',
    badgeBg: 'bg-blue-500/90 text-white',
    text: 'Plateforme Civitas News : Un nouvel espace citoyen pour la transparence, le débat et la démocratie participative.',
    link: '/news/news-2-lancement-plateforme-civitas-news',
  },
  {
    id: '4',
    badge: '🌿 TRANSITION ÉCOLO',
    badgeBg: 'bg-emerald-500/90 text-white',
    text: 'Transports Propres & Énergies Renouvelables : Publication du bilan annuel d\'impact environnemental.',
    link: '/news/news-3-transition-ecologique-transports-propres',
  },
  {
    id: '5',
    badge: '📈 STATISTIQUES',
    badgeBg: 'bg-purple-500/90 text-white',
    text: 'Engagements Citoyens : Plus de 18 200 membres actifs et 94% de taux de réponse aux consultations.',
    link: '/statistiques',
  },
];

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/' || location.pathname === '';

  const { theme, toggleTheme, searchQuery, setSearchQuery, openLoginModal } = useUiStore();
  const { unreadCount } = useNotificationsStore();
  // La connexion est STRICTEMENT OPTIONNELLE : aucune route ni requête
  // n'exige de session (voir LoginModal.tsx). `useAuthStore` sert donc
  // uniquement ici à savoir QUOI afficher dans ce coin de la topbar
  // (avatar si connecté, bouton "Se connecter" sinon) -- jamais à
  // bloquer l'accès à quoi que ce soit.
  const { user, isAuthenticated, isHydrating } = useAuthStore();
  const { can } = usePermissions();
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Carousel state for Homepage expanded header
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!isHome || isPaused) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % CAROUSEL_INFO.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isHome, isPaused]);

  const handleNextCarousel = () => {
    setCarouselIndex((prev) => (prev + 1) % CAROUSEL_INFO.length);
  };

  const handlePrevCarousel = () => {
    setCarouselIndex((prev) => (prev - 1 + CAROUSEL_INFO.length) % CAROUSEL_INFO.length);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    if (localSearch.trim()) {
      navigate(`/recherche?q=${encodeURIComponent(localSearch)}`);
    }
  };

  const currentInfo = CAROUSEL_INFO[carouselIndex];

  return (
    <motion.header
      initial={false}
      animate={{
        height: isHome ? '25vh' : '44px',
        minHeight: isHome ? '185px' : '44px',
      }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-40 w-full shadow-lg relative overflow-hidden text-white select-none flex flex-col justify-between"
    >
      {/* Background image & gradient overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={topbarPatternImg}
          alt="Topbar background pattern"
          className="w-full h-full object-cover object-center scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b3c68]/95 via-[#0078d4]/90 to-[#0e4b78]/95 backdrop-blur-[1.5px]" />
      </div>

      {/* Main Top Header Controls Bar */}
      <div className="relative z-10 max-w-7xl mx-auto px-2.5 sm:px-6 w-full pt-1.5 sm:pt-2 flex items-center justify-between gap-2 text-xs">
        {/* Top left badge when Home expanded */}
        {isHome ? (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3 }}
            className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-sky-200 uppercase tracking-widest bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20 backdrop-blur-sm"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Portail Citoyen & Actualités Nationales</span>
          </motion.div>
        ) : (
          /* Compact Left Logo & Title when on non-home pages */
          <div className="flex items-center gap-2.5 shrink-0">
            <Link to="/" className="flex items-center gap-2 hover:opacity-95 transition-opacity">
              <motion.div
                layoutId="civitas-logo-box"
                transition={{ duration: 0.4 }}
                className="shrink-0 flex items-center justify-center"
                title="CIVITAS NEWS"
              >
                <img src="/images/ChatGPT_Image_10_juin_2026__02_11_18-removebg-preview.png" alt="Logo CIVITAS" className="w-8 h-8 object-contain drop-shadow-sm" />
              </motion.div>

              <div className="flex items-center gap-1.5 font-display">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                  CIVITAS
                </span>
                <span className="bg-[#5B4DFF] text-white text-[10px] font-black px-1.5 py-0.5 rounded tracking-wider border border-white/20 shadow-sm">
                  NEWS
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Center: Search Bar (visible on non-home or compact header) */}
        {!isHome && (
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xs hidden sm:block relative">
            <div className="relative flex items-center">
              <Search className="w-3 h-3 absolute left-2 text-[#0078d4] pointer-events-none" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-6 pr-2 py-0.5 rounded-none bg-white dark:bg-[#1A1F4D]/90 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300 text-[11px] border border-transparent focus:outline-none focus:ring-1 focus:ring-blue-300 shadow-sm transition-all h-6 font-medium"
              />
            </div>
          </form>
        )}

        {/* Right Action Icons (Help, Theme, Notifications) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
          {/* Help icon */}
          <button
            type="button"
            className="hidden sm:flex p-1 rounded text-white/90 hover:text-white hover:bg-white/15 transition-colors"
            title="Aide & Support"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Theme switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex p-1 rounded text-white/90 hover:text-white hover:bg-white/15 transition-colors"
            title="Changer de thème"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Backoffice — icône visible uniquement pour les
              modérateurs/administrateurs (voir permissions.catalog.ts :
              BACKOFFICE_ACCESS/ADMIN_ACCESS), même niveau d'accès que
              /admin lui-même (voir BackofficeLayout). */}
          {isAuthenticated && (can(PERMISSIONS.BACKOFFICE_ACCESS) || can(PERMISSIONS.ADMIN_ACCESS)) && (
            <Link
              to="/admin"
              className="flex p-1 rounded text-white/90 hover:text-white hover:bg-white/15 transition-colors"
              title="Backoffice"
            >
              <ShieldCheck className="w-4 h-4" />
            </Link>
          )}

          {/* Notifications Trigger */}
          <Link
            to="/notifications"
            className="relative p-1 rounded text-white/90 hover:text-white hover:bg-white/15 transition-colors flex items-center justify-center"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-blue-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Connexion / Profil — la topbar est la source de vérité de
              l'état d'authentification, affichée sur toutes les pages
              (voir App.tsx). Pendant l'hydratation initiale (lecture du
              token stocké, voir auth.store.ts), on affiche un espace
              neutre plutôt que de flasher "Se connecter" puis basculer
              vers l'avatar une fois la session restaurée. */}
          {isHydrating ? (
            <div className="w-6 h-6 rounded-full bg-white/15 animate-pulse shrink-0" aria-hidden="true" />
          ) : isAuthenticated ? (
            <Link
              to="/profil"
              className="flex items-center justify-center w-6 h-6 rounded-full overflow-hidden border border-white/30 hover:border-white/70 transition-colors shrink-0"
              title={user.nomAffiche}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.nomAffiche} className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center bg-white/15 text-white text-[10px] font-bold uppercase">
                  {user.nomAffiche.charAt(0)}
                </span>
              )}
            </Link>
          ) : (
            <button
              type="button"
              onClick={openLoginModal}
              className="flex p-1 rounded text-white/90 hover:text-white hover:bg-white/15 transition-colors"
              title="Se connecter"
            >
              <LogIn className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Main Center Content (Homepage Only) */}
      <AnimatePresence>
        {isHome && (
          <motion.div
            key="home-center-hero"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 w-full flex-1 flex flex-col justify-center py-1 sm:py-2"
          >
            <div className="flex items-center justify-between gap-4">
              {/* Large Logo & Brand Headline */}
              <Link to="/" className="flex items-center gap-3.5 sm:gap-4 group">
                <motion.div
                  layoutId="civitas-logo-box"
                  transition={{ duration: 0.4 }}
                  className="shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform"
                >
                  <img src="/images/ChatGPT_Image_10_juin_2026__02_11_18-removebg-preview.png" alt="Logo CIVITAS" className="w-16 h-16 sm:w-24 sm:h-24 object-contain drop-shadow-lg" />
                </motion.div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2 font-display">
                    <span className="font-black text-xl sm:text-3xl tracking-tight text-white drop-shadow-sm">
                      CIVITAS
                    </span>
                    <span className="bg-[#5B4DFF] text-white text-xs sm:text-sm font-black px-2 py-0.5 rounded-md tracking-wider border border-white/30 shadow-md">
                      NEWS
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-blue-100/90 font-medium leading-tight max-w-lg mt-0.5">
                    Plateforme Officielle d'Information, Consultations & Démocratie Participative
                  </p>
                </div>
              </Link>

              {/* Quick Search on Homepage Topbar (Desktop) */}
              <form onSubmit={handleSearchSubmit} className="hidden md:block w-72 relative shrink-0">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 absolute left-3 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    placeholder="Rechercher une news, un sondage..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/15 backdrop-blur-md text-white placeholder-blue-100/70 text-xs border border-white/20 focus:outline-none focus:ring-2 focus:ring-sky-300/60 shadow-inner transition-all font-medium"
                  />
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Textual Carousel Strip (Homepage Only) */}
      <AnimatePresence>
        {isHome && (
          <motion.div
            key="home-carousel-strip"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 max-w-7xl mx-auto px-2.5 sm:px-6 w-full pb-2"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="bg-slate-900/60 backdrop-blur-md border border-white/15 rounded-xl p-1.5 sm:p-2 flex items-center justify-between gap-2 shadow-lg">
              {/* Badge & Carousel Text Container */}
              <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 shadow-sm transition-colors ${currentInfo.badgeBg}`}
                >
                  {currentInfo.badge}
                </span>

                <div className="relative flex-1 overflow-hidden h-5 flex items-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentInfo.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="absolute inset-0 flex items-center"
                    >
                      <Link
                        to={currentInfo.link}
                        className="text-xs sm:text-xs font-semibold text-white hover:text-sky-200 transition-colors truncate block max-w-full"
                        title={currentInfo.text}
                      >
                        {currentInfo.text}
                      </Link>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Carousel Navigation Controls & Dots */}
              <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-white/15">
                {/* Dots indicator */}
                <div className="hidden sm:flex items-center gap-1 px-1">
                  {CAROUSEL_INFO.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => setCarouselIndex(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === carouselIndex ? 'w-4 bg-sky-300' : 'w-1.5 bg-white/30 hover:bg-white/60'
                      }`}
                      aria-label={`Aller au message ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Arrow buttons */}
                <button
                  type="button"
                  onClick={handlePrevCarousel}
                  className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                  title="Message précédent"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleNextCarousel}
                  className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                  title="Message suivant"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

