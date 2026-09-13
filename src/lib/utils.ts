type ClassValue = string | number | null | boolean | undefined;

/** Concatène des classes Tailwind conditionnelles (équivalent minimal de
 * clsx, aucune dépendance externe nécessaire pour ce projet). */
export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(' ');
}

/** Découpe un tableau en sous-tableaux de taille `size` maximum (dernier
 * groupe potentiellement incomplet). Utilisé par les vues qui doivent
 * paginer un jeu de données par lots fixes (ex : carrousel d'utilisateurs
 * du backoffice, 8 par slide) sans dépendance externe type lodash.chunk. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (size <= 0) return items.length ? [items.slice()] : [];
  const groups: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
}
