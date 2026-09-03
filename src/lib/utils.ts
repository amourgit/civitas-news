type ClassValue = string | number | null | boolean | undefined;

/** Concatène des classes Tailwind conditionnelles (équivalent minimal de
 * clsx, aucune dépendance externe nécessaire pour ce projet). */
export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(' ');
}
