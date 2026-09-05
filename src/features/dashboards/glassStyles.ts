// ============================================================
// src/features/dashboards/glassStyles.ts
// Recette glassmorphism unique, réutilisée par tous les widgets des
// deux tableaux de bord refondus (Admin /admin et Statistiques
// /statistiques) : un seul point de vérité pour que chaque carte
// réagisse pareil aux variations de thème clair/sombre (voir
// useUiStore côté bascule) plutôt qu'une recette copiée-collée dans
// chaque composant.
// ============================================================

/** Carte "verre dépoli" : fond translucide + flou, bordure et ombre
 * adaptées au thème. À poser sur GLASS_PAGE_BACKGROUND (ou tout fond
 * avec un peu de couleur/relief -- un verre sur un blanc plat ne se
 * distingue quasiment pas). */
export const GLASS_CARD =
  'rounded-3xl border backdrop-blur-xl transition-colors duration-300 ' +
  'bg-white/70 dark:bg-[#131A3D]/60 ' +
  'border-white/60 dark:border-white/10 ' +
  'shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)]';

/** Variante plus discrète pour les petites tuiles internes (mini-icônes, chips). */
export const GLASS_TILE =
  'rounded-2xl border backdrop-blur-md transition-colors duration-300 ' +
  'bg-white/50 dark:bg-white/[0.04] ' +
  'border-white/50 dark:border-white/10';

/** Fond dégradé ambiant des deux shells de dashboard : donne au verre
 * quelque chose à réfracter, dans les deux thèmes. */
export const GLASS_PAGE_BACKGROUND =
  'bg-gradient-to-br from-[#F3F1FF] via-[#F8F8FC] to-[#EEF2FF] ' +
  'dark:from-[#0A0D24] dark:via-[#0D1130] dark:to-[#141A3D]';

/** Couleurs de la marque CIVITAS pour les graphiques (recharts), dans
 * l'ordre d'usage privilégié -- reprend --civitas-purple (src/index.css). */
export const CHART_COLORS = ['#5B4DFF', '#22D3EE', '#F59E0B', '#34D399', '#F472B6', '#94A3B8'];

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#0E1338',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  fontSize: '11px',
  color: '#fff',
  boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
} as const;
