// ============================================================
// src/components/backoffice/users/UserOrbitCarousel.tsx
// Carrousel visuel des utilisateurs : il constitue désormais LA vue
// liste du backoffice Utilisateurs, en lieu et place du tableau
// générique (voir ModelDef.ListExtras + listExtrasMode: 'replace' dans
// utilisateur.registry.ts, et le rendu dans BackofficeListPage). Le
// design du carrousel orbital -- carte active, rotation des avatars,
// navigation, indicateurs -- est repris à l'identique d'une maquette
// existante ; seules la source de données (utilisateurs réels de
// l'API, pas d'avatar photo -> initiales) et la pagination par lots de
// 8 sont propres à cet usage backoffice.
//
// Règle de pagination (volontairement stricte, voir USERS_PER_SLIDE) :
// un slide contient AU MAXIMUM 8 utilisateurs, jamais un slide par
// utilisateur. Le nombre de slides = Math.ceil(total / 8) et de
// nouvelles slides apparaissent automatiquement à mesure que la liste
// d'utilisateurs grandit, toujours avec ce même seuil de 8.
//
// Deux niveaux de navigation, volontairement distincts :
//  - à l'intérieur de la carte active (flèches + points sous l'orbite) :
//    fait tourner l'orbite parmi les (<= 8) utilisateurs du slide
//    courant -- comportement identique à la maquette d'origine ;
//  - au-dessus de l'orbite (visible seulement si > 1 slide) : change de
//    slide, donc de lot de 8 utilisateurs.
// ============================================================

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Briefcase, ChevronLeft, ChevronRight, ArrowUpRight, Users as UsersIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { BackendUser } from '../../../types/models/backend.types';
import { ROLE_LABELS } from '../../../lib/constants/userRoles';
import { chunk } from '../../../lib/utils';
import { Skeleton } from '../../ui/Skeleton';

/** Nombre maximum d'utilisateurs par slide -- seuil fixe et unique,
 * exporté pour rester la seule source de vérité (tests, réutilisation). */
export const USERS_PER_SLIDE = 8;

type ScreenSize = 'xs' | 'sm' | 'md' | 'lg';

interface OrbitPerson {
  id: number;
  name: string;
  role: string;
  email: string;
  initials: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return '?';
}

function toOrbitPerson(user: BackendUser): OrbitPerson {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  const name = fullName || user.username || `Utilisateur #${user.id}`;
  return {
    id: user.id,
    name,
    role: (user.role && ROLE_LABELS[user.role]) || 'Citoyen',
    email: user.email || 'Email non renseigné',
    initials: getInitials(name),
  };
}

/** Pastille avatar en initiales -- l'API Utilisateur n'expose pas de
 * photo de profil sur cet endpoint. Même palette de marque que le
 * composant Avatar partagé (src/components/ui/Avatar.tsx), à des
 * tailles arbitraires en pixels pour coller précisément aux gabarits
 * (responsives) de l'orbite d'origine. */
function InitialsAvatar({
  initials,
  sizePx,
  className = '',
}: {
  initials: string;
  sizePx: number;
  className?: string;
}) {
  return (
    <div
      style={{ width: sizePx, height: sizePx, fontSize: sizePx * 0.36 }}
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-[#5B4DFF] to-[#1A1F4D] text-white font-bold shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
}

const useResponsive = (): ScreenSize => {
  const [screenSize, setScreenSize] = React.useState<ScreenSize>('lg');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 480) setScreenSize('xs');
      else if (width < 640) setScreenSize('sm');
      else if (width < 768) setScreenSize('md');
      else setScreenSize('lg');
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return screenSize;
};

function getResponsiveValues(screenSize: ScreenSize) {
  switch (screenSize) {
    case 'xs':
      return {
        containerRadius: 100, profileSize: 45, cardWidth: 'w-36',
        avatarPx: 48, avatarMargin: '-mt-8',
        fontSize: { name: 'text-sm', role: 'text-xs', email: 'text-xs' },
      };
    case 'sm':
      return {
        containerRadius: 120, profileSize: 55, cardWidth: 'w-40',
        avatarPx: 56, avatarMargin: '-mt-9',
        fontSize: { name: 'text-base', role: 'text-xs', email: 'text-xs' },
      };
    case 'md':
      return {
        containerRadius: 150, profileSize: 65, cardWidth: 'w-44',
        avatarPx: 64, avatarMargin: '-mt-10',
        fontSize: { name: 'text-base', role: 'text-sm', email: 'text-xs' },
      };
    default:
      return {
        containerRadius: 200, profileSize: 80, cardWidth: 'w-52',
        avatarPx: 80, avatarMargin: '-mt-12',
        fontSize: { name: 'text-lg', role: 'text-sm', email: 'text-xs' },
      };
  }
}

/** Un slide = l'orbite complète (design d'origine) pour un lot d'AU
 * PLUS `USERS_PER_SLIDE` utilisateurs. L'index actif est local au
 * slide et repart à 0 à chaque changement de lot. */
function OrbitSlide({
  people,
  onOpenUser,
}: {
  people: OrbitPerson[];
  onOpenUser: (id: number) => void;
}) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isHovering, setIsHovering] = React.useState(false);
  const screenSize = useResponsive();

  const { containerRadius, profileSize, cardWidth, avatarPx, avatarMargin, fontSize } = getResponsiveValues(screenSize);
  const containerSize = containerRadius * 2 + 100;

  const getRotation = React.useCallback(
    (index: number): number => (index - activeIndex) * (360 / people.length),
    [activeIndex, people.length],
  );

  const next = React.useCallback(
    () => setActiveIndex((i) => (i + 1) % people.length),
    [people.length],
  );
  const prev = React.useCallback(
    () => setActiveIndex((i) => (i - 1 + people.length) % people.length),
    [people.length],
  );

  const handleProfileClick = React.useCallback((index: number) => {
    setActiveIndex((current) => (index === current ? current : index));
  }, []);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'ArrowLeft') prev();
      else if (event.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prev, next]);

  React.useEffect(() => {
    if (isHovering || people.length <= 1) return;
    const interval = setInterval(() => next(), 5000);
    return () => clearInterval(interval);
  }, [isHovering, next, people.length]);

  if (people.length === 0) return null;
  const active = people[activeIndex] ?? people[0];

  return (
    <div
      className="flex flex-col items-center p-2 sm:p-4 relative min-h-[350px] sm:min-h-[400px] bg-white dark:bg-black transition-colors duration-300"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative flex items-center justify-center" style={{ width: containerSize, height: containerSize }}>
        {/* Active Person Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`z-10 bg-white dark:bg-gray-950 backdrop-blur-sm shadow-xl dark:shadow-2xl dark:shadow-gray-900/50 rounded-xl p-2 sm:p-3 md:p-4 ${cardWidth} text-center border border-gray-100 dark:border-gray-800`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className={`mx-auto ${avatarMargin}`}
              style={{ width: avatarPx, height: avatarPx }}
            >
              <InitialsAvatar
                initials={active.initials}
                sizePx={avatarPx}
                className="border-4 border-white dark:border-black shadow-md"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
              <h2 className={`mt-2 font-bold text-gray-800 dark:text-white truncate ${fontSize.name}`}>{active.name}</h2>
              <div className={`flex items-center justify-center text-gray-600 dark:text-gray-400 mt-1 ${fontSize.role}`}>
                <Briefcase size={12} className="mr-1" />
                <span className="truncate">{active.role}</span>
              </div>
              <div className={`flex items-center justify-center text-gray-500 dark:text-gray-500 mt-0.5 ${fontSize.email}`}>
                <Mail size={12} className="mr-1" />
                <span className="truncate">{active.email}</span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex justify-center items-center mt-2 sm:mt-3 space-x-1 sm:space-x-2"
            >
              {people.length > 1 && (
                <button
                  onClick={prev}
                  aria-label="Utilisateur précédent"
                  className="p-1 sm:p-1.5 rounded-full bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronLeft size={14} className="text-gray-700 dark:text-gray-300 sm:w-4 sm:h-4" />
                </button>
              )}
              <button
                onClick={() => onOpenUser(active.id)}
                className="flex items-center gap-1 px-3 sm:px-4 py-0.5 sm:py-1 text-xs sm:text-sm rounded-full bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors"
              >
                Voir la fiche
                <ArrowUpRight size={12} />
              </button>
              {people.length > 1 && (
                <button
                  onClick={next}
                  aria-label="Utilisateur suivant"
                  className="p-1 sm:p-1.5 rounded-full bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                >
                  <ChevronRight size={14} className="text-gray-700 dark:text-gray-300 sm:w-4 sm:h-4" />
                </button>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Orbiting Profiles with Counter-Rotation */}
        {people.map((p, i) => {
          const rotation = getRotation(i);
          const isActive = i === activeIndex;

          return (
            <motion.div
              key={p.id}
              animate={{ transform: `rotate(${rotation}deg) translateY(-${containerRadius}px)` }}
              transition={{
                type: 'spring', stiffness: 150, damping: 20,
                delay: isActive ? 0 : Math.abs(i - activeIndex) * 0.05,
              }}
              style={{
                width: profileSize, height: profileSize, position: 'absolute',
                top: `calc(50% - ${profileSize / 2}px)`, left: `calc(50% - ${profileSize / 2}px)`,
                zIndex: isActive ? 20 : 10,
              }}
            >
              {/* Counter-rotation to keep avatar upright */}
              <motion.div
                animate={{ rotate: -rotation }}
                transition={{ type: 'spring', stiffness: 150, damping: 20 }}
                className="w-full h-full"
              >
                <motion.button
                  type="button"
                  onClick={() => handleProfileClick(i)}
                  whileHover={{ scale: 1.15, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={p.name}
                  className={`w-full h-full rounded-full cursor-pointer transition-all duration-300 ${
                    isActive
                      ? 'border-4 border-indigo-500 dark:border-indigo-400 shadow-lg'
                      : 'border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
                  }`}
                >
                  <InitialsAvatar initials={p.initials} sizePx={profileSize} className="w-full h-full" />
                </motion.button>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress Indicator (utilisateurs du slide courant) */}
      <div className="flex justify-center mt-4 sm:mt-6 space-x-1.5 sm:space-x-2">
        {people.map((p, index) => (
          <motion.button
            key={p.id}
            onClick={() => setActiveIndex(index)}
            aria-label={`Aller à ${p.name}`}
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
              index === activeIndex ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>
    </div>
  );
}

export interface UserOrbitCarouselProps {
  records: BackendUser[];
  isLoading: boolean;
}

/**
 * Carrousel de la page liste des Utilisateurs (backoffice), branché via
 * ModelDef.ListExtras (voir utilisateur.registry.ts). Pagine les
 * utilisateurs par lots (slides) de USERS_PER_SLIDE (8) au maximum ;
 * de nouvelles slides sont ajoutées automatiquement quand le nombre
 * d'utilisateurs augmente, toujours avec ce même seuil -- jamais un
 * slide par utilisateur.
 */
export default function UserOrbitCarousel({ records, isLoading }: UserOrbitCarouselProps) {
  const navigate = useNavigate();
  const [slideIndex, setSlideIndex] = React.useState(0);

  const slides = React.useMemo(
    () => chunk(records.map(toOrbitPerson), USERS_PER_SLIDE),
    [records],
  );
  const slideCount = slides.length;

  // Si le nombre d'utilisateurs diminue (suppression, filtre...) et que
  // le slide courant n'existe plus, on retombe sur le dernier valide.
  React.useEffect(() => {
    setSlideIndex((current) => Math.min(current, Math.max(0, slideCount - 1)));
  }, [slideCount]);

  const handleOpenUser = React.useCallback((id: number) => {
    navigate(`/admin/utilisateur/${id}`);
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-black p-6 flex flex-col items-center gap-4 min-h-[350px] sm:min-h-[400px] justify-center">
        <Skeleton variant="circular" width={80} height={80} />
        <Skeleton variant="text" width={160} />
        <Skeleton variant="text" width={120} />
      </div>
    );
  }

  if (slideCount === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-black p-8 flex flex-col items-center gap-2 text-center">
        <UsersIcon size={28} className="text-gray-300 dark:text-gray-700" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Aucun utilisateur à afficher.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-black overflow-hidden">
      {/* En-tête toujours visible : le carrousel remplaçant le tableau,
          il porte seul l'information de volumétrie. Les contrôles de
          pagination, eux, n'apparaissent qu'au-delà de 8 utilisateurs
          (c.-à-d. dès qu'il existe un second groupe). */}
      <div className="flex items-center justify-between gap-3 px-3 sm:px-4 pt-3 sm:pt-4">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {slideCount > 1 && `Groupe ${slideIndex + 1} / ${slideCount} · `}
          {records.length} utilisateur{records.length > 1 ? 's' : ''}
        </span>
        {slideCount > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSlideIndex((s) => (s - 1 + slideCount) % slideCount)}
              aria-label="Groupe précédent"
              className="p-1 sm:p-1.5 rounded-full bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft size={14} className="text-gray-700 dark:text-gray-300" />
            </button>
            <div className="flex items-center gap-1">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIndex(i)}
                  aria-label={`Aller au groupe ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === slideIndex ? 'w-4 bg-indigo-600 dark:bg-indigo-400' : 'w-1.5 bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setSlideIndex((s) => (s + 1) % slideCount)}
              aria-label="Groupe suivant"
              className="p-1 sm:p-1.5 rounded-full bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight size={14} className="text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        )}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={slideIndex}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
        >
          <OrbitSlide people={slides[slideIndex] ?? []} onOpenUser={handleOpenUser} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
