// ============================================================
// src/components/backoffice/users/profile/useReferentielNom.ts
// Résout le libellé d'un établissement/organisation par son id --
// volontairement via le repository (pas via le registre du backoffice)
// pour ne créer aucune dépendance circulaire avec
// utilisateur.registry.ts, qui importe la fiche.
// `kind = null` désactive la résolution (hook appelé sans condition par
// les cadres qui ne portent pas de FK).
// ============================================================

import { useEffect, useState } from 'react';
import { referentielsRepository } from '../../../../services/api/repositories/referentiels.repository';

export function useReferentielNom(
  kind: 'etablissement' | 'organisation' | null,
  id: number | null | undefined,
): string | null {
  const [nom, setNom] = useState<string | null>(null);

  useEffect(() => {
    setNom(null);
    if (kind === null || id === null || id === undefined) return undefined;
    let cancelled = false;
    const fetcher = kind === 'etablissement'
      ? referentielsRepository.getEtablissement(String(id))
      : referentielsRepository.getOrganisation(String(id));
    fetcher
      .then((rec) => { if (!cancelled) setNom(rec.nom); })
      .catch(() => { if (!cancelled) setNom(`#${id}`); });
    return () => { cancelled = true; };
  }, [kind, id]);

  return nom;
}
