// ============================================================
// src/components/auth/TenantSelectButton.tsx
// Sélecteur d'organisation (tenant) pour LoginModal -- CHAQUE
// connexion/inscription cible un tenant précis (voir
// store/tenants.store.ts : "Global ≠ Tenant", "un seul tenant
// courant"). Impossible de deviner lequel pour un visiteur qui n'a
// jamais visité ce tenant sur cet appareil (recentTenants vide) ni
// pour qui veut explicitement en rejoindre un autre -- ce bouton force
// donc un choix explicite (voir validation dans LoginModal.tsx), et
// injecte IMMÉDIATEMENT ce choix dans tenants.store (switchTenant),
// pas seulement à la soumission : GoogleSignInButton et le reste du
// formulaire doivent hériter tout de suite du bon X-Tenant-Domain
// (voir authFetchInterceptor.ts).
//
// Réutilise, sans les dupliquer :
// - InlineCellPopover (positionnement/portail/clic extérieur), avec un
//   panelStyle en z-[110] pour dépasser le z-[100] de LoginModal
//   (voir le commentaire sur `panelStyle` dans InlineCellPopover.tsx) ;
// - SearchableOptionsList (recherche + coche), déjà utilisé par le
//   combobox du backoffice (SelectComboboxField.tsx).
// Seul le DÉCLENCHEUR est propre à ce fichier, habillé avec les mêmes
// classes .civ-auth-glass-input(-wrap) que les champs identifiant/mot
// de passe de LoginModal (voir AuthGlassKit.tsx) -- même langage
// visuel, pas un composant de sélection étranger au popup.
// ============================================================

import { useState } from 'react';
import { Building2, ChevronsUpDown, RotateCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAsyncResource } from '../../hooks/useAsyncResource';
import { tenantsRepository } from '../../services/api/repositories/tenants.repository';
import { SearchableOptionsList } from '../ui/SearchableOptionsList';
import { InlineCellPopover } from '../backoffice/fields/InlineCellPopover';
import type { TenantRef } from '../../store/tenants.store';

export interface TenantSelectButtonProps {
  value: TenantRef | null;
  onSelect: (tenant: TenantRef) => void;
  disabled?: boolean;
  /** Même convention visuelle que fieldErrors dans LoginModal (contour rouge). */
  hasError?: boolean;
}

export function TenantSelectButton({ value, onSelect, disabled, hasError }: TenantSelectButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // reportToGlobalOverlay: false -- une liste d'organisations qui se
  // charge à l'ouverture du popup ne doit pas replonger toute la page
  // dans l'overlay plein écran (voir useAsyncResource.ts) ; l'état de
  // chargement est géré localement, dans le panneau lui-même.
  const {
    data: tenants,
    isLoading,
    error,
    refetch,
  } = useAsyncResource(() => tenantsRepository.list(), [], { reportToGlobalOverlay: false });

  const triggerLabel = value?.name || 'Choisir une organisation';

  return (
    <div className={cn('civ-auth-glass-input-wrap', hasError && 'civ-auth-glass-input--error')}>
      <InlineCellPopover
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        disabled={disabled}
        panelStyle={{ zIndex: 110 }}
        panelClassName="p-1.5"
        trigger={
          <button
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className="civ-auth-glass-input w-full text-left disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="relative z-10 flex w-9 flex-shrink-0 items-center justify-center pl-2">
              <Building2 className="h-4 w-4 flex-shrink-0 text-gray-400" />
            </div>
            <span
              className={cn(
                'relative z-10 flex-1 truncate pr-1 text-sm',
                value ? 'text-gray-900 dark:text-white' : 'text-gray-400'
              )}
            >
              {triggerLabel}
            </span>
            <div className="relative z-10 flex w-9 flex-shrink-0 items-center justify-center pr-2 text-gray-400">
              <ChevronsUpDown className="h-3.5 w-3.5" />
            </div>
          </button>
        }
      >
        {isLoading && <p className="px-2.5 py-3 text-sm text-gray-400">Chargement des organisations…</p>}
        {!isLoading && error && (
          <div className="flex flex-col items-start gap-1.5 px-2.5 py-3">
            <p className="text-sm text-gray-400">Impossible de charger la liste.</p>
            <button
              type="button"
              onClick={refetch}
              className="flex items-center gap-1 text-xs font-semibold text-[#5B4DFF] hover:underline"
            >
              <RotateCw className="h-3 w-3" /> Réessayer
            </button>
          </div>
        )}
        {!isLoading && !error && (
          <SearchableOptionsList
            options={(tenants ?? []).map((t) => ({ value: t.sousDomaine, label: t.name }))}
            value={value?.domainHeaderValue ?? null}
            searchPlaceholder="Rechercher une organisation…"
            emptyLabel="Aucune organisation ne correspond."
            onSelect={(sousDomaine) => {
              const tenant = (tenants ?? []).find((t) => t.sousDomaine === sousDomaine);
              if (!tenant) return;
              // Injection immédiate dans le store -- toute requête
              // suivante (y compris Google) part vers ce tenant, sans
              // attendre la soumission du formulaire.
              onSelect({ domainHeaderValue: tenant.sousDomaine, name: tenant.name });
              setIsOpen(false);
            }}
          />
        )}
      </InlineCellPopover>
    </div>
  );
}
