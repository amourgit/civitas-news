'use client';

import * as React from 'react';
import { cn } from '../../../lib/utils';
import {
  Building2, Globe, Link2, Facebook, Instagram, Twitter, Linkedin, Youtube,
  MessageCircle, Music2, MapPin, Award,
} from 'lucide-react';
import { News } from '../../../types/global.types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import './NewsCardAuthorBadge.css';

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

/**
 * Icônes des plateformes reconnues sur `Organisation.reseauxSociaux`
 * (dictionnaire libre côté backend — voir referentiels/models.py, aucune
 * contrainte de clé). Une clé absente de cette table est simplement
 * ignorée à l'affichage plutôt que de casser le rendu -- voir
 * RESEAU_SOCIAL_PLATEFORMES dans types/models/user.types.ts pour la
 * liste canonique. 'x' est un alias moderne de 'twitter' ; whatsapp/tiktok
 * n'ayant pas d'icône dédiée dans lucide-react, on retombe sur une icône
 * générique proche (MessageCircle / Music2).
 */
const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  x: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  whatsapp: MessageCircle,
  tiktok: Music2,
};

function hoteDeUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export interface NewsCardAuthorBadgeProps {
  news: News;
}

/**
 * Badge auteur -- coin haut-gauche de la news card. Structure/animation
 * inchangées (voir NewsCardAuthorBadge.css : 3 rebonds à l'ouverture) ;
 * seul le CONTENU du panneau change désormais par rapport à la version
 * précédente (qui affichait des libellés de démonstration type "Profile
 * / Model / Subscription / Settings / Sign Out") : il présente
 * maintenant les VRAIES données de la News --
 *  - en haut : l'organisation publiante (logo, nom, type, description,
 *    site web, réseaux sociaux) quand la News en a une, sinon
 *    l'établissement de l'auteur en repli ;
 *  - en bas : l'auteur à l'origine de la publication (avatar, nom,
 *    rôle, badges, statistiques de contribution).
 * Toutes ces données sont déjà exposées par NewsListSerializer côté
 * backend (auteur = UtilisateurPublicSerializer, organisation =
 * OrganisationNesteeSerializer), aucun appel réseau supplémentaire
 * n'est nécessaire ici. Contenu volontairement compact (textes 9-11px,
 * paddings serrés) pour tenir dans la largeur fixe du panneau (w-64).
 */
export const NewsCardAuthorBadge: React.FC<NewsCardAuthorBadgeProps> = ({ news }) => {
  const auteur = news.auteur;
  const organisation = news.organisation;
  const [isOpen, setIsOpen] = React.useState(false);

  if (!auteur) return null;

  // `auteur.role` est nullable (voir UtilisateurSchema) : un compte sans
  // adhésion dans ce tenant n'a simplement pas de rôle applicatif ici.
  const roleLabel = auteur.role ? ROLE_LABELS[auteur.role] || auteur.role : 'Membre';
  const orgTypeLabel = organisation
    ? TYPE_ORGANISATION_LABELS[organisation.type] || organisation.type
    : undefined;
  const secondaryLine = organisation?.nom || auteur.etablissement || undefined;

  const liensReseauxSociaux = Object.entries(organisation?.reseauxSociaux || {}).filter(
    ([plateforme, url]) => !!url && !!SOCIAL_ICONS[plateforme.toLowerCase()]
  );
  const siteWeb = organisation?.siteWeb || '';

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
            className="news-card-author-badge-panel w-64 max-h-[70vh] overflow-y-auto p-2.5 bg-white/10 backdrop-blur-2xl border border-white/25 rounded-2xl shadow-xl shadow-black/30"
          >
            {/* --- Organisation publiante (ou établissement en repli) --- */}
            {organisation ? (
              <div className="px-0.5 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 border border-white/20 shrink-0 flex items-center justify-center">
                    {organisation.logo ? (
                      <img src={organisation.logo} alt={organisation.nom} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-4 h-4 text-white/70" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate leading-tight">
                      {organisation.nom}
                    </div>
                    {orgTypeLabel && (
                      <div className="text-[10px] text-white/60 truncate leading-tight">{orgTypeLabel}</div>
                    )}
                  </div>
                </div>

                {organisation.description && (
                  <p className="mt-1.5 text-[10.5px] text-white/70 leading-snug line-clamp-2">
                    {organisation.description}
                  </p>
                )}

                {(siteWeb || liensReseauxSociaux.length > 0) && (
                  <div className="mt-2 flex items-center flex-wrap gap-1.5">
                    {siteWeb && (
                      <DropdownMenuItem asChild>
                        <a
                          href={siteWeb}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-[10px] text-white/80 transition-colors"
                        >
                          <Globe className="w-3 h-3 shrink-0" />
                          <span className="truncate max-w-[7rem]">{hoteDeUrl(siteWeb)}</span>
                        </a>
                      </DropdownMenuItem>
                    )}
                    {liensReseauxSociaux.map(([plateforme, url]) => {
                      const Icon = SOCIAL_ICONS[plateforme.toLowerCase()] || Link2;
                      return (
                        <DropdownMenuItem key={plateforme} asChild>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={plateforme}
                            title={plateforme}
                            className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 transition-colors"
                          >
                            <Icon className="w-3 h-3" />
                          </a>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : auteur.etablissement ? (
              <div className="px-0.5 pb-2 flex items-center gap-1.5 text-[10.5px] text-white/70">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{auteur.etablissement}</span>
              </div>
            ) : null}

            <DropdownMenuSeparator className="my-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* --- Auteur à l'origine de la publication --- */}
            <div className="flex items-center gap-2 px-0.5 py-1">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-0.5 shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden bg-white/10">
                  {auteur.avatar ? (
                    <img
                      src={auteur.avatar}
                      alt={auteur.nomAffiche}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-white">
                      {auteur.nomAffiche?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-white truncate leading-tight">
                  {auteur.nomAffiche}
                </div>
                <div className="text-[9.5px] text-white/60 truncate leading-tight">
                  {roleLabel}
                  {organisation && auteur.etablissement ? ` · ${auteur.etablissement}` : ''}
                </div>
              </div>
              {auteur.badges && auteur.badges.length > 0 && (
                <div
                  className="flex items-center gap-0.5 shrink-0"
                  title={auteur.badges.map((b) => b.nom).join(', ')}
                >
                  <Award className="w-3 h-3 text-amber-300" />
                  <span className="text-[9.5px] text-amber-200 font-semibold">{auteur.badges.length}</span>
                </div>
              )}
            </div>

            {auteur.stats && (
              <div className="mt-1.5 grid grid-cols-3 gap-1 px-0.5">
                <div className="text-center rounded-lg bg-white/5 py-1">
                  <div className="text-[11px] font-bold text-white leading-none">{auteur.stats.contributions}</div>
                  <div className="text-[8.5px] text-white/50 mt-0.5">Contrib.</div>
                </div>
                <div className="text-center rounded-lg bg-white/5 py-1">
                  <div className="text-[11px] font-bold text-white leading-none">{auteur.stats.commentaires}</div>
                  <div className="text-[8.5px] text-white/50 mt-0.5">Comment.</div>
                </div>
                <div className="text-center rounded-lg bg-white/5 py-1">
                  <div className="text-[11px] font-bold text-white leading-none">{auteur.stats.votes}</div>
                  <div className="text-[8.5px] text-white/50 mt-0.5">Votes</div>
                </div>
              </div>
            )}
          </DropdownMenuContent>
        </div>
      </DropdownMenu>
    </div>
  );
};

export default NewsCardAuthorBadge;
