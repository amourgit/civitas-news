// ============================================================
// src/pages/OrganisationDetailsPage.tsx
// Détails d'une organisation — DEUX entrées, UNE seule page :
//   /organisation                   -> organisation COURANTE
//   /organisations/:sousDomaine     -> organisation consultée
//                                      (redirigée vers /organisation
//                                       si c'est en fait la courante)
//
// Règle centrale (voir lib/permissions/organisationScope.ts) :
//  - identité publique : visible partout ;
//  - fiche administrative + modification : UNIQUEMENT sur
//    l'organisation courante ET selon le rôle (administrateur).
// Un administrateur de A qui consulte B est, pour B, un visiteur.
// Chaque section décide seule de son affichage/édition via sa
// permission déclarée dans organisationFiche.schema.ts.
// ============================================================
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Lock, ArrowLeft, AlertTriangle } from 'lucide-react';
import { useTenantsStore } from '../store/tenants.store';
import { useAuthStore } from '../store/auth.store';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { OrganisationHero } from '../features/organisations/details/components/OrganisationHero';
import { OrganisationScopeBanner } from '../features/organisations/details/components/OrganisationScopeBanner';
import { FicheSectionCard } from '../features/organisations/details/components/FicheSectionCard';
import { FICHE_SECTIONS } from '../features/organisations/details/organisationFiche.schema';
import { useOrganisationDetails } from '../features/organisations/details/useOrganisationDetails';

const OrganisationDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { sousDomaine } = useParams<{ sousDomaine?: string }>();
  const { currentTenant } = useTenantsStore();
  const { isAuthenticated } = useAuthStore();
  const details = useOrganisationDetails(sousDomaine);

  // Une même organisation ne doit jamais s'afficher avec deux jeux de
  // privilèges selon l'URL par laquelle on y arrive.
  const isCurrentByUrl =
    !!sousDomaine && !!currentTenant && sousDomaine.toLowerCase() === currentTenant.domainHeaderValue.toLowerCase();
  useEffect(() => {
    if (isCurrentByUrl) navigate('/organisation', { replace: true });
  }, [isCurrentByUrl, navigate]);

  const back = (
    <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate('/')}>
      Retour aux organisations
    </Button>
  );

  if (!sousDomaine && !currentTenant) {
    return (
      <EmptyState
        icon={<Building2 className="h-8 w-8" />}
        title="Aucune organisation courante"
        description="Connectez-vous à une organisation, ou parcourez l’annuaire depuis l’accueil pour en consulter une."
        actionLabel="Voir les organisations"
        onAction={() => navigate('/')}
      />
    );
  }

  if (details.state === 'loading' || isCurrentByUrl) {
    return (
      <div className="space-y-4 py-2">
        <Skeleton variant="card" height={180} className="rounded-3xl" />
        <Skeleton variant="card" height={220} className="rounded-3xl" />
      </div>
    );
  }

  if (details.state === 'not-found' || details.state === 'error' || !details.tenant) {
    return (
      <div className="space-y-3 py-2">
        {back}
        <EmptyState
          icon={<AlertTriangle className="h-8 w-8" />}
          title={details.state === 'error' ? 'Chargement impossible' : 'Organisation introuvable'}
          description={
            details.state === 'error'
              ? 'L’annuaire des organisations ne répond pas pour le moment. Réessayez dans un instant.'
              : 'Aucune organisation ne correspond à cette adresse.'
          }
        />
      </div>
    );
  }

  const { tenant, scope, can, canViewFiche, fiche, ficheError, saveFiche } = details;
  const visibleSections = FICHE_SECTIONS.filter((section) => can(section.viewPermission));

  return (
    <div className="space-y-4 py-2">
      {!details.isCurrent && back}
      <OrganisationHero tenant={tenant} scope={scope} />
      <OrganisationScopeBanner scope={scope} isAuthenticated={isAuthenticated} canViewFiche={canViewFiche} />

      {tenant.description && (
        <section className="rounded-3xl border border-gray-200 bg-white/70 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-6">
          <h2 className="font-display text-base font-bold text-gray-900 dark:text-white">À propos</h2>
          <p className="mt-2 max-w-prose whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {tenant.description}
          </p>
        </section>
      )}

      {canViewFiche ? (
        ficheError ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
            {ficheError}
          </div>
        ) : !fiche ? (
          <Skeleton variant="card" height={220} className="rounded-3xl" />
        ) : (
          visibleSections.map((section) => (
            <FicheSectionCard
              key={section.id}
              section={section}
              fiche={fiche}
              canEdit={!!section.editPermission && can(section.editPermission)}
              onSave={saveFiche}
            />
          ))
        )
      ) : (
        <section className="flex items-start gap-3 rounded-3xl border border-dashed border-gray-300 px-5 py-6 text-sm text-gray-500 dark:border-white/15 dark:text-gray-400">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="max-w-prose">
            Fiche administrative réservée aux administrateurs de cette organisation : identité légale, coordonnées, responsables et suivi de vérification.
          </p>
        </section>
      )}
    </div>
  );
};

export default OrganisationDetailsPage;
