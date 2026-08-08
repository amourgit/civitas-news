// ============================================================
// src/config/env.ts
// Point d'entrée unique pour lire les variables d'environnement
// Vite (import.meta.env). Toute nouvelle variable VITE_* doit être
// exposée ici plutôt que lue directement dans le code métier —
// cela évite d'avoir des `import.meta.env.VITE_...` dispersés dans
// des dizaines de fichiers de services.
//
// Règle de bascule mock / API réelle (voir services/*.service.ts) :
//   - En PRODUCTION (`vite build`, `import.meta.env.PROD === true`),
//     TOUS les services utilisent automatiquement les vraies données
//     via services/api/repositories/. Aucune donnée mock n'est
//     livrée en production.
//   - En développement, les mocks sont utilisés par défaut (itération
//     rapide sans dépendre d'un backend local démarré), mais peuvent
//     être désactivés à la demande avec VITE_USE_MOCK_DATA=false
//     pour tester contre un vrai backend en local.
//   - VITE_USE_MOCK_DATA, si définie explicitement, a toujours la
//     priorité (permet aussi de forcer le mock en production pour
//     une démo, par exemple).
// ============================================================

interface ImportMetaEnvLike {
  VITE_API_BASE_URL?: string;
  VITE_USE_MOCK_DATA?: string;
  VITE_GOOGLE_CLIENT_ID?: string;
  DEV?: boolean;
  PROD?: boolean;
  MODE?: string;
}

const rawEnv = ((import.meta as unknown as { env?: ImportMetaEnvLike }).env ?? {}) as ImportMetaEnvLike;

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined || value === '') return undefined;
  return value === 'true' || value === '1';
}

const isProd = Boolean(rawEnv.PROD);
const isDev = Boolean(rawEnv.DEV) || !isProd;

// Priorité : VITE_USE_MOCK_DATA explicite > automatique selon l'environnement.
const explicitMockFlag = parseBoolean(rawEnv.VITE_USE_MOCK_DATA);
const useMockData = explicitMockFlag !== undefined ? explicitMockFlag : isDev;

export const env = {
  /** Base URL de l'API backend (Backend-Core-Base). Ex: https://tenant1.civitasnews.org/api */
  apiBaseUrl: rawEnv.VITE_API_BASE_URL || '/api',

  /**
   * true  -> les services lisent/écrivent dans les données mock locales
   *          (services/api/mocks/), utile en développement/démo.
   * false -> les services appellent le vrai backend via
   *          services/api/repositories/. C'est TOUJOURS le cas en
   *          production, sauf override explicite.
   */
  useMockData,

  isDev,
  isProd,
  mode: rawEnv.MODE || 'development',

  /**
   * OAuth Client ID (type "Web application") créé dans Google Cloud
   * Console — voir components/auth/GoogleSignInButton.tsx. DOIT être
   * identique à GOOGLE_OAUTH_CLIENT_ID côté backend (Backend-Core-Base
   * config/settings.py), c'est l'audience vérifiée sur le id_token.
   * Chaîne vide -> le bouton Google Sign-In s'affiche désactivé avec un
   * message clair plutôt que d'échouer silencieusement.
   */
  googleClientId: rawEnv.VITE_GOOGLE_CLIENT_ID || '',
};

export type Env = typeof env;
