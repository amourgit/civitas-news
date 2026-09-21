// ============================================================
// src/components/home/organisations/OrganisationCard.tsx
// Carte "Organisation" de la section d'accueil -- design REMPLACÉ
// entièrement (demande explicite : "sans aucune différence" avec le
// composant fourni) par la carte de profil glassmorphism donnée :
// structure, glow flouté, bannière flottante et animations reprises
// à l'identique. Seuls le SENS des zones et les DONNÉES changent pour
// coller à une organisation plutôt qu'à une personne :
//  - avatar -> logo du tenant (Tenant.logo), icône par défaut
//    (Building2 sur fond dégradé de marque, .gradient-brand) si aucun
//    logo n'est renseigné ;
//  - "role" (sous le nom) -> identifiant de sous-domaine
//    (@sousDomaine), toujours disponible côté Tenant ;
//  - pastille de statut -> "Organisation active" (fixe : cette
//    section ne liste que les tenants actifs de l'annuaire public,
//    voir OrganisationsSection.tsx) ;
//  - horloge -> remplacée par "Depuis <année de création>". Une
//    horloge locale n'a pas de sens ici, et tous les tenants de ce
//    carrousel partagent le même fuseau : l'originale aurait affiché
//    la même heure sur CHAQUE carte, signe trop visible d'un champ
//    non branché ;
//  - les deux boutons -> "Visiter le site" (ouvre https://{domain})
//    et "Copier le lien" (même URL copiée), proprement désactivés si
//    le tenant n'a pas encore de domaine public ;
//  - bannière inférieure (icône éclair) -> description courte du
//    tenant si renseignée, sinon une formule de repli.
//
// Plus de panneaux dépliants ni de liste d'actualités : le composant
// fourni n'en a pas, et la demande est un remplacement complet, pas
// une fusion avec l'ancien comportement (voir git log pour l'ancienne
// version, façon "carte artiste").
// ============================================================
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Building2, Clock, Copy, ExternalLink, Zap } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Tenant } from '../../../services/api/repositories/tenants.repository';

/** Tronque un texte à `max` caractères (ellipse simple, suffisant pour
 * une bannière d'une ligne). */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

/** Logo du tenant en grand format, ou icône de repli sur fond dégradé
 * de marque si aucun logo n'a été renseigné -- jamais de silhouette
 * générique type "image cassée". */
const OrganisationLogo: React.FC<{ tenant: Tenant }> = ({ tenant }) =>
  tenant.logo ? (
    <div className="relative h-52 w-52 shrink-0 overflow-hidden rounded-[20px] ring-2 ring-white/10">
      <img
        src={tenant.logo}
        alt={`Logo ${tenant.name}`}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  ) : (
    <div className="gradient-brand relative flex h-52 w-52 shrink-0 items-center justify-center overflow-hidden rounded-[20px] ring-2 ring-white/10">
      <Building2 className="h-20 w-20 text-white/90" strokeWidth={1.5} />
    </div>
  );

export const OrganisationCard: React.FC<{ tenant: Tenant }> = ({ tenant }) => {
  const [copied, setCopied] = useState(false);

  const publicUrl = tenant.domain
    ? `https://${tenant.domain}`
    : tenant.sousDomaine
      ? `https://${tenant.sousDomaine}`
      : null;

  const creationYear = tenant.createdAt ? new Date(tenant.createdAt).getFullYear() : null;
  const tagline = tenant.description ? truncate(tenant.description, 64) : 'Nouvelle organisation sur la plateforme';

  const handleCopy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Silencieux, comme dans le composant fourni.
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative w-[320px] max-w-[85vw] shrink-0"
    >
      {/* Glow flouté citron-vert débordant sous la carte -- z-0, en
          partie masqué par la carte (z-10) : seule la portion qui
          dépasse du bord inférieur reste visible. */}
      <div className="pointer-events-none absolute inset-x-6 -bottom-8 h-20 rounded-[28px] bg-lime-400/80 blur-2xl" />

      {/* Bannière flottante posée sur ce glow, sous la carte. */}
      <div className="absolute inset-x-0 -bottom-8 z-0 mx-auto w-full">
        <div className="flex items-center justify-center gap-2 px-6 py-2.5 text-center text-sm font-medium text-black">
          <Zap className="h-4 w-4 shrink-0" />
          <span className="truncate">{tagline}</span>
        </div>
      </div>

      <div
        className={cn(
          'relative z-10 mx-auto w-full overflow-visible rounded-[20px]',
          'bg-white/10 dark:bg-white/5 backdrop-blur-xl',
          'border border-black/20 dark:border-white/10',
          'shadow-lg shadow-black/20',
        )}
      >
        <div className="p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-lime-500" />
              <span className="select-none">Organisation active</span>
            </div>
            {creationYear && (
              <div className="flex items-center gap-2 opacity-80">
                <Clock className="h-4 w-4 shrink-0" />
                <span className="tabular-nums">Depuis {creationYear}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center gap-5">
            <OrganisationLogo tenant={tenant} />
            <div className="min-w-0 text-center">
              <h3 className="truncate font-display text-xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-3xl">
                {tenant.name}
              </h3>
              <p className="mt-0.5 truncate text-sm text-neutral-500 dark:text-neutral-400">@{tenant.sousDomaine}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <a
              href={publicUrl ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => {
                if (!publicUrl) event.preventDefault();
              }}
              className={cn(
                'flex h-12 items-center justify-start gap-3 rounded-2xl border border-black/10 dark:border-white/10',
                'bg-white/50 px-4 text-sm font-medium text-neutral-800 transition-colors hover:bg-white/70',
                'dark:bg-white/5 dark:text-white dark:hover:bg-white/10',
                !publicUrl && 'pointer-events-none opacity-40',
              )}
            >
              <ExternalLink className="h-4 w-4 shrink-0" /> Visiter le site
            </a>

            <button
              type="button"
              disabled={!publicUrl}
              onClick={handleCopy}
              className={cn(
                'flex h-12 items-center justify-start gap-3 rounded-2xl border border-black/10 dark:border-white/10',
                'bg-white/50 px-4 text-sm font-medium text-neutral-800 transition-colors hover:bg-white/70',
                'dark:bg-white/5 dark:text-white dark:hover:bg-white/10',
                !publicUrl && 'opacity-40',
              )}
            >
              <Copy className="h-4 w-4 shrink-0" /> {copied ? 'Copié' : 'Copier le lien'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
