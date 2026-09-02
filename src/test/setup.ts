import '@testing-library/jest-dom';

// jsdom n'implémente pas window.matchMedia -- polyfill minimal (recommandé
// par la doc Vitest/Testing Library) pour tout composant utilisant
// useMediaQuery (voir src/hooks/useMediaQuery.ts), sans quoi son premier
// rendu dans un test lève "window.matchMedia is not a function".
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {}, // API dépréciée, encore appelée par certains libs
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
