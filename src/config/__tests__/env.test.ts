import { describe, it, expect } from 'vitest';
import { resolveTenantHost } from '../env';

/**
 * Fonction pure testée directement avec de simples chaînes -- voir le
 * commentaire sur resolveTenantHost dans env.ts pour l'explication
 * complète (import.meta.env est remplacé STATIQUEMENT par Vite à la
 * transformation, un mock au runtime dans un test n'a donc aucun effet
 * fiable sur ce que lit un module réimporté ; testé ici en isolant la
 * seule logique de décision qui compte).
 */
describe('resolveTenantHost — priorité VITE_TENANT_HOST vs hostname du navigateur', () => {
  it('utilise la valeur explicite si définie, même si le navigateur affiche un autre hostname', () => {
    // Cas réel visé : un déploiement de prévisualisation Vercel, URL
    // générée à chaque fois, mais le tenant à interroger reste fixe.
    expect(
      resolveTenantHost('civitasnews', 'civitas-news-git-preview-amourgit.vercel.app')
    ).toBe('civitasnews');
  });

  it("retombe sur le hostname du navigateur si la valeur explicite n'est pas définie", () => {
    expect(resolveTenantHost(undefined, 'civitasnews.vercel.app')).toBe('civitasnews.vercel.app');
  });

  it('ignore une valeur explicite vide ou faite uniquement d\'espaces', () => {
    expect(resolveTenantHost('', 'civitasnews.vercel.app')).toBe('civitasnews.vercel.app');
    expect(resolveTenantHost('   ', 'civitasnews.vercel.app')).toBe('civitasnews.vercel.app');
  });

  it('retourne null si ni la valeur explicite ni le navigateur ne sont disponibles (SSR/tests)', () => {
    expect(resolveTenantHost(undefined, null)).toBeNull();
  });

  it('retire les espaces superflus autour de la valeur explicite', () => {
    expect(resolveTenantHost('  civitasnews  ', 'autrechose.vercel.app')).toBe('civitasnews');
  });
});
