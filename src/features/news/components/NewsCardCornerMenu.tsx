'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { motion, LayoutGroup } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import useMeasure from 'react-use-measure';
import {
  UserIcon,
  CreditCardIcon,
  FolderIcon,
  File01Icon,
  SettingsIcon,
  HelpCircleIcon,
  LogoutIcon,
  MoreHorizontalCircle01Icon,
} from '@hugeicons/core-free-icons';

// Change Here
const menuItems = [
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'upgrade', label: 'Upgrade', icon: CreditCardIcon },
  { id: 'projects', label: 'Projects', icon: FolderIcon },
  { id: 'documentation', label: 'Documentation', icon: File01Icon },
  { id: 'divider', label: '', icon: null },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
  { id: 'help', label: 'Get Help', icon: HelpCircleIcon },
  { id: 'logout', label: 'Logout', icon: LogoutIcon },
];

const easeOutQuint: [number, number, number, number] = [0.23, 1, 0.32, 1];

/**
 * Réplique fidèle du composant "TwentyTwelveOne" (menu flottant qui se
 * déplie en accordéon, spring + stagger sur les items). Seule
 * modification demandée par rapport à la source : le fond du
 * composant -- fermé (bouton rond) comme ouvert (panneau) -- passe en
 * verre dépoli (glassmorphism) au lieu des tokens shadcn
 * (bg-popover/border-border/bg-muted/text-foreground) absents de ce
 * projet. Logique, état, easing, delays, structure JSX : strictement
 * intacts.
 *
 * `LayoutGroup` (scopé via `useId`) est l'unique ajout d'intégration :
 * la card apparaît en grille (NewsGrid), donc plusieurs instances de
 * ce menu coexistent en même temps -- sans ce scope, les `layoutId`
 * internes ("activeIndicator"/"leftBar") seraient partagés entre
 * toutes les cards et casseraient l'animation.
 */
export function NewsCardCornerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('profile');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scopeId = useId();

  const [contentRef, contentBounds] = useMeasure();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const openHeight = Math.max(40, Math.ceil(contentBounds.height));
  return (
    <LayoutGroup id={scopeId}>
      <div ref={containerRef} className="relative h-10 w-10 not-prose">
        <motion.div
          layout
          initial={false}
          animate={{
            width: isOpen ? 220 : 40,
            height: isOpen ? openHeight : 40,
            borderRadius: isOpen ? 14 : 12,
          }}
          transition={{
            type: 'spring' as const,
            damping: 34,
            stiffness: 380,
            mass: 0.8,
          }}
          className="absolute top-0 right-0 bg-white/10 backdrop-blur-2xl border border-white/25 shadow-xl shadow-black/20 overflow-hidden cursor-pointer origin-top-right"
          onClick={() => !isOpen && setIsOpen(true)}
        >
          <motion.div
            initial={false}
            animate={{
              opacity: isOpen ? 0 : 1,
              scale: isOpen ? 0.8 : 1,
            }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              pointerEvents: isOpen ? 'none' : 'auto',
              willChange: 'transform',
            }}
          >
            <HugeiconsIcon
              icon={MoreHorizontalCircle01Icon}
              className="w-5 h-5 text-white"
            />
          </motion.div>

          {/* Menu Content - visible when open */}
          <div ref={contentRef}>
            <motion.div
              layout
              initial={false}
              animate={{
                opacity: isOpen ? 1 : 0,
              }}
              transition={{
                duration: 0.2,
                delay: isOpen ? 0.08 : 0,
              }}
              className="p-2"
              style={{
                pointerEvents: isOpen ? 'auto' : 'none',
                willChange: 'transform',
              }}
            >
              <ul className="flex flex-col gap-0.5 m-0! p-0! list-none!">
                {menuItems.map((item, index) => {
                  if (item.id === 'divider') {
                    return (
                      <motion.hr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isOpen ? 1 : 0 }}
                        transition={{ delay: isOpen ? 0.12 + index * 0.015 : 0 }}
                        className="border-white/20 my-1.5!"
                      />
                    );
                  }

                  const iconRef = item.icon!;
                  const isActive = activeItem === item.id;
                  const isLogout = item.id === 'logout';
                  const showIndicator = hoveredItem
                    ? hoveredItem === item.id
                    : isActive;

                  const itemDuration = item.id === 'logout' ? 0.12 : 0.15;
                  const itemDelay = isOpen ? 0.06 + index * 0.02 : 0;

                  return (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{
                        opacity: isOpen ? 1 : 0,
                        x: isOpen ? 0 : 8,
                      }}
                      transition={{
                        delay: itemDelay,
                        duration: itemDuration,
                        ease: easeOutQuint,
                      }}
                      onClick={() => {
                        setActiveItem(item.id);
                        if (item.id === 'logout') {
                          setIsOpen(false);
                        }
                      }}
                      onMouseEnter={() => setHoveredItem(item.id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={`relative flex items-center gap-3 rounded-lg text-sm cursor-pointer transition-colors duration-200 ease-out m-0! pl-3! py-2! ${
                        isLogout && showIndicator
                          ? 'text-red-300'
                          : isActive
                          ? 'text-white'
                          : isLogout
                          ? 'text-white/70 hover:text-red-300'
                          : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {/* Hover/Active background indicator */}
                      {showIndicator && (
                        <motion.div
                          layoutId="activeIndicator"
                          className={`absolute inset-0 rounded-lg ${
                            isLogout ? 'bg-red-500/20' : 'bg-white/15'
                          }`}
                          transition={{
                            type: 'spring',
                            damping: 30,
                            stiffness: 520,
                            mass: 0.8,
                          }}
                        />
                      )}
                      {/* Left bar indicator */}
                      {showIndicator && (
                        <motion.div
                          layoutId="leftBar"
                          className={`absolute left-0 top-0 bottom-0 my-auto w-[3px] h-5 rounded-full ${
                            isLogout ? 'bg-red-400' : 'bg-white'
                          }`}
                          transition={{
                            type: 'spring',
                            damping: 30,
                            stiffness: 520,
                            mass: 0.8,
                          }}
                        />
                      )}
                      <HugeiconsIcon
                        icon={iconRef}
                        className="w-[18px] h-[18px] relative z-10"
                      />
                      <span className="font-medium relative z-10">
                        {item.label}
                      </span>
                    </motion.li>
                  );
                })}
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </LayoutGroup>
  );
}

export default NewsCardCornerMenu;
