'use client';

import * as React from 'react';
import { cn } from '../../../lib/utils';
import { Settings, CreditCard, FileText, LogOut, User } from 'lucide-react';
import { News } from '../../../types/global.types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import './NewsCardAuthorBadge.css';

interface MenuItem {
  label: string;
  value?: string;
  icon: React.ReactNode;
}

const ROLE_LABELS: Record<string, string> = {
  administrateur: 'Administrateur',
  moderateur: 'Modérateur',
  etudiant: 'Étudiant',
  organisation: 'Organisation',
  anonyme: 'Citoyen',
};

const TYPE_ORGANISATION_LABELS: Record<string, string> = {
  association_etudiante: 'Association étudiante',
  administration: 'Administration',
  club: 'Club',
  departement: 'Département académique',
  autre: 'Organisation',
};

export interface NewsCardAuthorBadgeProps {
  news: News;
}

/**
 * Réplique fidèle du composant "ProfileDropdown" fourni : même
 * structure (trigger avatar en anneau dégradé + nom + ligne
 * secondaire, flèche "bending line" qui réagit au survol/à l'ouverture,
 * DropdownMenuContent en lignes icône+label+pastille de valeur,
 * séparateur, bouton d'action rouge en bas), même logique isOpen --
 * copiées à l'identique depuis la source. L'animation d'ouverture du
 * panneau, elle, a depuis été remplacée (voir plus bas) par un rebond
 * sur-mesure : ce n'est plus la classe `animate-in` d'origine.
 *
 * Adaptations strictement nécessaires (la source vient d'un projet
 * Next.js ; ce projet est Vite + react-router-dom) :
 *  - `next/image` -> `<img>`, `next/link` -> `<a>` (ces deux modules
 *    n'existent pas hors Next.js, le build cassait sinon) ;
 *  - `@/components/ui/dropdown-menu` (Radix) créé car absent du
 *    projet -- `@radix-ui/react-dropdown-menu` ajouté en dépendance ;
 *  - le logo "Gemini" (marque tierce, alimentait un champ "Model" sans
 *    rapport avec ce contexte) remplacé par une icône neutre.
 *
 * Adaptations demandées explicitement : fond verre dépoli PARTOUT
 * (fermé et ouvert) et EN PERMANENCE, quel que soit l'état (plus
 * d'opacité réduite au repos rétablie au survol/focus -- l'ancien
 * comportement scintillait entre "quasi transparent" et "plein verre"
 * selon le survol de la card). Le panneau qui s'ouvre au clic
 * (DropdownMenuContent) anime son entrée avec 3 rebonds explicites
 * avant stabilisation (voir NewsCardAuthorBadge.css), à la place des
 * classes `animate-in`/`zoom-in-95` par défaut du wrapper -- retirées
 * de components/ui/dropdown-menu.tsx, dont ce composant est l'unique
 * consommateur. Les données injectées sont celles de la news :
 * auteur (nom/avatar) et tenant/organisation, déjà exposées par l'API
 * (NewsListSerializer), aucun changement backend requis.
 */
export const NewsCardAuthorBadge: React.FC<NewsCardAuthorBadgeProps> = ({ news }) => {
  const auteur = news.auteur;
  const organisation = news.organisation;
  const [isOpen, setIsOpen] = React.useState(false);

  if (!auteur) return null;

  const roleLabel = ROLE_LABELS[auteur.role] || auteur.role;
  const orgTypeLabel = organisation
    ? TYPE_ORGANISATION_LABELS[organisation.type] || organisation.type
    : undefined;
  const secondaryLine = organisation?.nom || auteur.etablissement || undefined;

  const menuItems: MenuItem[] = [
    {
      label: 'Profile',
      icon: <User className="w-4 h-4" />,
    },
    {
      label: 'Model',
      value: roleLabel,
      icon: <CreditCard className="w-4 h-4" />,
    },
    ...(organisation
      ? [
          {
            label: 'Subscription',
            value: orgTypeLabel,
            icon: <FileText className="w-4 h-4" />,
          },
        ]
      : []),
    {
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <div
      className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-30"
      data-no-card-click
      onClick={(e) => e.stopPropagation()}
    >
      <DropdownMenu onOpenChange={setIsOpen}>
        <div className="group relative">
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 sm:gap-2.5 max-w-none pl-1 pr-2.5 sm:pr-3 py-1 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/25 hover:border-white/35 hover:bg-white/15 hover:shadow-sm shadow-xl shadow-black/20 transition-all duration-200 focus:outline-none"
            >
              <div className="relative shrink-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-0.5">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white/10">
                    {auteur.avatar ? (
                      <img
                        src={auteur.avatar}
                        alt={auteur.nomAffiche}
                        width={28}
                        height={28}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white">
                        {auteur.nomAffiche?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-left min-w-0">
                <div className="text-[11px] sm:text-xs font-medium text-white tracking-tight leading-tight truncate">
                  {auteur.nomAffiche}
                </div>
                {secondaryLine && (
                  <div className="text-[9px] sm:text-[10px] text-white/70 tracking-tight leading-tight truncate">
                    {secondaryLine}
                  </div>
                )}
              </div>
            </button>
          </DropdownMenuTrigger>

          {/* Bending line indicator on the right */}
          <div
            className={cn(
              'absolute -right-3 top-1/2 -translate-y-1/2 transition-all duration-200',
              isOpen ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
            )}
          >
            <svg
              width="12"
              height="24"
              viewBox="0 0 12 24"
              fill="none"
              className={cn(
                'transition-all duration-200',
                isOpen ? 'text-blue-300 scale-110' : 'text-white/60 group-hover:text-white/90'
              )}
              aria-hidden="true"
            >
              <path
                d="M2 4C6 8 6 16 2 20"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          <DropdownMenuContent
            align="start"
            sideOffset={4}
            className="news-card-author-badge-panel w-64 p-2 bg-white/10 backdrop-blur-2xl border border-white/25 rounded-2xl shadow-xl shadow-black/30"
          >
            <div className="space-y-1">
              {menuItems.map((item, i) => (
                <DropdownMenuItem key={item.label} asChild>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="flex items-center p-3 hover:bg-white/15 rounded-xl transition-all duration-200 cursor-pointer group hover:shadow-sm border border-transparent hover:border-white/20"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-white/80">{item.icon}</span>
                      <span className="text-sm font-medium text-white tracking-tight leading-tight whitespace-nowrap transition-colors">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex-shrink-0 ml-auto">
                      {item.value && (
                        <span
                          className={cn(
                            'text-xs font-medium rounded-md py-1 px-2 tracking-tight border',
                            i === 1
                              ? 'text-blue-200 bg-blue-500/15 border-blue-400/20'
                              : 'text-purple-200 bg-purple-500/15 border-purple-400/20'
                          )}
                        >
                          {item.value}
                        </span>
                      )}
                    </div>
                  </a>
                </DropdownMenuItem>
              ))}
            </div>

            <DropdownMenuSeparator className="my-3 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <DropdownMenuItem asChild>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 p-3 duration-200 bg-red-500/10 rounded-xl hover:bg-red-500/20 cursor-pointer border border-transparent hover:border-red-500/30 hover:shadow-sm transition-all group"
              >
                <LogOut className="w-4 h-4 text-red-400 group-hover:text-red-300" />
                <span className="text-sm font-medium text-red-400 group-hover:text-red-300">
                  Sign Out
                </span>
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </div>
      </DropdownMenu>
    </div>
  );
};

export default NewsCardAuthorBadge;
