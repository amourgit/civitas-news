// ============================================================
// Bandeau qui explique, sans ambiguïté, CE QUE l'utilisateur voit et
// pourquoi : organisation courante (session ouverte dedans) ou simple
// consultation (aucun privilège, même pour un administrateur d'une
// AUTRE organisation). Voir lib/permissions/organisationScope.ts.
// ============================================================
import React from 'react';
import { Eye, ShieldCheck, Lock } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { OrganisationScope } from '../../../../lib/permissions/organisationScope';

interface Props {
  scope: OrganisationScope;
  isAuthenticated: boolean;
  canViewFiche: boolean;
}

export const OrganisationScopeBanner: React.FC<Props> = ({ scope, isAuthenticated, canViewFiche }) => {
  const config =
    scope === 'consultee'
      ? {
          icon: <Eye className="h-4 w-4" />,
          title: 'Vous consultez cette organisation',
          text: 'Seules ses informations publiques sont affichées. Ses informations administratives ne sont accessibles qu’à ses administrateurs, lorsqu’ils sont connectés à elle — y compris si vous êtes administrateur d’une autre organisation.',
          tone: 'border-amber-300/60 bg-amber-50 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100',
        }
      : canViewFiche
        ? {
            icon: <ShieldCheck className="h-4 w-4" />,
            title: 'Votre organisation — accès administrateur',
            text: 'Vous êtes connecté(e) à cette organisation. Vous pouvez consulter sa fiche complète et modifier les sections autorisées pour votre rôle.',
            tone: 'border-emerald-300/60 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100',
          }
        : {
            icon: <Lock className="h-4 w-4" />,
            title: 'Votre organisation',
            text: isAuthenticated
              ? 'Vous êtes connecté(e) à cette organisation, mais sa fiche administrative est réservée à ses administrateurs.'
              : 'Connectez-vous avec un compte administrateur de cette organisation pour accéder à sa fiche administrative.',
            tone: 'border-gray-200 bg-gray-50 text-gray-800 dark:border-white/10 dark:bg-white/5 dark:text-gray-200',
          };

  return (
    <div role="status" className={cn('flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm', config.tone)}>
      <span className="mt-0.5 shrink-0">{config.icon}</span>
      <div className="min-w-0">
        <p className="font-semibold">{config.title}</p>
        <p className="mt-0.5 max-w-prose opacity-90">{config.text}</p>
      </div>
    </div>
  );
};
