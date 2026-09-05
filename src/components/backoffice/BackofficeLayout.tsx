// ============================================================
// src/components/backoffice/BackofficeLayout.tsx
// ============================================================

import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { getModel } from './registry';
import { usePermissions } from '../../lib/permissions/usePermissions';
import { PERMISSIONS } from '../../lib/permissions/permissions.catalog';
import { useAuthStore } from '../../store/auth.store';
import { AppLoadingOverlay } from '../ui/AppLoadingOverlay';

export const BackofficeLayout: React.FC = () => {
  const { can } = usePermissions();
  const { isHydrating } = useAuthStore();
  const { modelKey } = useParams<{ modelKey?: string }>();

  // Avant : `return null` pendant l'hydratation -- un trou vide dans la
  // mise en page le temps de savoir si l'utilisateur a accès au
  // backoffice, avant de basculer brutalement vers "Accès réservé" ou
  // le vrai contenu. On affiche désormais le chargement de marque le
  // temps que la permission soit connue, sans quoi la fine gestion des
  // droits d'accès de cette page se traduirait par un flash visible.
  if (isHydrating) return <AppLoadingOverlay visible label="Vérification de vos accès…" />;

  if (!can(PERMISSIONS.BACKOFFICE_ACCESS) && !can(PERMISSIONS.ADMIN_ACCESS)) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 gap-3 px-4">
        <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
          <ShieldOff className="w-7 h-7" />
        </div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Accès réservé</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          Le backoffice est réservé aux modérateurs et administrateurs de la plateforme.
        </p>
      </div>
    );
  }

  const currentModel = getModel(modelKey);

  return (
    <div className="w-full min-w-0">
      <Outlet />
    </div>
  );
};
