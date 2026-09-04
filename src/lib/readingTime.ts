/**
 * Estimation du temps de lecture d'un contenu (markdown/texte brut),
 * à la manière des plateformes éditoriales classiques -- calcul
 * purement côté client à partir du texte déjà chargé, aucun appel
 * réseau supplémentaire. ~200 mots/minute (moyenne lecture silencieuse
 * adulte), arrondi à la minute supérieure, minimum 1 min dès qu'il y a
 * du contenu.
 */
export function estimateReadingTimeMinutes(...texts: Array<string | undefined | null>): number {
  const combined = texts.filter(Boolean).join(' ');
  if (!combined.trim()) return 0;

  // Retire la syntaxe markdown la plus courante avant de compter les mots,
  // pour ne pas gonfler artificiellement le temps de lecture avec des
  // caractères de mise en forme (#, *, [], etc.).
  const plain = combined
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*_~-]/g, ' ');

  const wordCount = plain.split(/\s+/).filter(Boolean).length;
  const WORDS_PER_MINUTE = 200;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
