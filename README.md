<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/3762059a-7678-4cbd-85f0-e74bd7509caf

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Architecture des services (services/api/)

Toute la couche d'accès aux données du frontend est construite sur
`src/services/api/` :

- `services/api/base`, `GetService.ts`, `PostService.ts`, `UpdateService.ts`,
  `DeleteService.ts`, `HttpServiceFactory.ts` : le socle HTTP générique
  (retry, validation Zod, gestion d'erreurs, auth, cache).
- `services/api/endpoints.ts` : registre central de toutes les routes
  backend (réelles et conventions prévues).
- `services/api/repositories/` : implémentation réelle par domaine
  (auth, users, tenants, news, commentaires, sondages, liens,
  statistiques, notifications, administration), construite à 100% sur
  le socle ci-dessus.
- `services/api/mocks/` : données de démonstration, utilisées
  uniquement quand le mode mock est actif.
- `src/types/models/` : schémas Zod canoniques par domaine (source de
  vérité des types), ré-exportés depuis `src/types/global.types.ts`.
- `src/lib/permissions/` : permissions frontend granulaires par rôle.

Les services racine (`src/services/*.service.ts`, ex. `news.service.ts`)
sont la façade utilisée par les composants — inchangée dans son API
publique — et basculent automatiquement entre mocks et backend réel
selon `env.useMockData` (voir `src/config/env.ts` et `.env.example`) :
mock par défaut en développement, réel automatiquement en production.

**État actuel du backend** (`Backend-Core-Base`, branche `civitas-news`) :
authentification, utilisateurs et tenants sont réellement implémentés
et fonctionnels. Les domaines de contenu (news, commentaires, sondages,
liens, statistiques, notifications, administration) n'existent pas
encore côté backend — les repositories correspondants sont prêts et
suivent la convention de `endpoints.ts`, en attendant leur implémentation.
