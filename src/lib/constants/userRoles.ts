// ============================================================
// src/lib/constants/userRoles.ts
// Libellés lisibles des rôles applicatifs (voir
// types/models/user.types.ts:RoleUtilisateurSchema côté schéma riche,
// types/models/backend.types.ts:BackendUser.role côté API brute).
// Centralisé ici, indépendant du registre backoffice, pour être
// importable à la fois par utilisateur.registry.ts (options du champ
// <select> "Rôle") ET par des composants d'affichage comme
// UserOrbitCarousel -- sans dépendance circulaire entre les deux.
// ============================================================

export interface RoleOption {
  value: string;
  label: string;
}

/** Rôles applicatifs réellement stockables sur un compte -- 'anonyme'
 * n'est jamais persisté côté backend (voir UserViewSet), donc absent
 * de cette liste utilisée pour le champ <select> et les libellés. */
export const ROLE_OPTIONS: RoleOption[] = [
  { value: 'etudiant', label: 'Étudiant' },
  { value: 'organisation', label: 'Organisation' },
  { value: 'moderateur', label: 'Modérateur' },
  { value: 'administrateur', label: 'Administrateur' },
];

/** Même liste sous forme de table de correspondance value -> label,
 * pratique pour l'affichage (ex : carte utilisateur, badge de rôle). */
export const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  ROLE_OPTIONS.map((option) => [option.value, option.label]),
);
