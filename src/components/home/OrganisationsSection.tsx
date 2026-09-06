// ============================================================
// src/components/home/OrganisationsSection.tsx
// Section "Organisations" de la page d'accueil -- même pattern que
// MeteoLiquidGlassSection.tsx (titre + sous-titre à gauche, action à
// droite, puis contenu) ; le contenu ici est la liste des organisations
// (tenants), chacune rendue via OrganisationCard (voir ce fichier :
// design/animations copiés tels quels du composant fourni).
// ============================================================
import React from 'react';
import { Building2 } from 'lucide-react';
import { useReferentiels } from '../../features/news/hooks/useReferentiels';
import { Skeleton } from '../ui/Skeleton';
import { OrganisationCard } from './organisations/OrganisationCard';

export const OrganisationsSection: React.FC = () => {
  const { organisations, isLoading, error } = useReferentiels();

  return (
    <div className="w-full my-4 space-y-3">
      {/* Titre sans cadre / sans section englobante -- identique au
          bloc-titre de MeteoLiquidGlassSection.tsx */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-[#5B4DFF]/10 dark:bg-[#5B4DFF]/20 text-[#5B4DFF]">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white font-display tracking-tight leading-none">
              Organisations
            </h2>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">
              Associations, administrations et clubs actifs sur la plateforme
            </p>
          </div>
        </div>
      </div>

      {/* Contenu : cartes organisations, défilement horizontal (cartes
          riches en hauteur -- panneaux dépliants -- un carrousel se
          prête mieux qu'une grille). Le titre ci-dessus reste TOUJOURS
          affiché, même sans donnée/en erreur -- la section ne doit
          jamais disparaître entièrement en silence. */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory no-scrollbar">
          <Skeleton variant="card" height={420} className="w-[320px] max-w-[85vw] shrink-0 rounded-3xl" />
          <Skeleton variant="card" height={420} className="w-[320px] max-w-[85vw] shrink-0 rounded-3xl" />
          <Skeleton variant="card" height={420} className="w-[320px] max-w-[85vw] shrink-0 rounded-3xl" />
        </div>
      ) : organisations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          {error ? "Impossible de charger les organisations pour l'instant." : 'Aucune organisation pour le moment.'}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory no-scrollbar">
          {organisations.map((organisation) => (
            <OrganisationCard key={organisation.id} organisation={organisation} />
          ))}
        </div>
      )}
    </div>
  );
};
