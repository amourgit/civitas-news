// ============================================================
// En-tête de la page de détails : identité PUBLIQUE de l'organisation
// (logo, nom, sous-domaine, description, liens). Aucune donnée
// sensible ici : identique pour l'organisation courante et consultée.
// ============================================================
import React, { useState } from 'react';
import { Building2, Copy, ExternalLink, CalendarDays } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import type { Tenant } from '../../../../services/api/repositories/tenants.repository';
import type { OrganisationScope } from '../../../../lib/permissions/organisationScope';

interface Props {
  tenant: Tenant;
  scope: OrganisationScope;
}

export function tenantPublicUrl(tenant: Tenant): string | null {
  if (tenant.domain) return `https://${tenant.domain}`;
  return tenant.sousDomaine ? `https://${tenant.sousDomaine}` : null;
}

export const OrganisationHero: React.FC<Props> = ({ tenant, scope }) => {
  const [copied, setCopied] = useState(false);
  const url = tenantPublicUrl(tenant);
  const since = tenant.createdAt ? new Date(tenant.createdAt).getFullYear() : null;

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* presse-papiers indisponible : sans effet */
    }
  };

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-gray-200 bg-white/70 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:p-6">
      <div
        className={cn(
          'relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl ring-2 ring-black/5 dark:ring-white/10',
          !tenant.logo && 'gradient-brand',
        )}
      >
        {tenant.logo ? (
          <img src={tenant.logo} alt={`Logo ${tenant.name}`} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Building2 className="h-12 w-12 text-white/90" strokeWidth={1.5} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">{tenant.name}</h1>
          <Badge variant={scope === 'courante' ? 'success' : 'outline'} size="sm">
            {scope === 'courante' ? 'Organisation courante' : 'Consultation'}
          </Badge>
        </div>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">@{tenant.sousDomaine}</p>
        {since && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <CalendarDays className="h-4 w-4" /> Sur la plateforme depuis {since}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={url ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => !url && e.preventDefault()}
            className={cn(!url && 'pointer-events-none opacity-40')}
          >
            <Button variant="secondary" size="sm" icon={<ExternalLink className="h-4 w-4" />} tabIndex={-1}>
              Visiter le site
            </Button>
          </a>
          <Button variant="ghost" size="sm" icon={<Copy className="h-4 w-4" />} onClick={copy} disabled={!url}>
            {copied ? 'Lien copié' : 'Copier le lien'}
          </Button>
        </div>
      </div>
    </section>
  );
};
