// ============================================================
// src/types/global.types.ts
// ------------------------------------------------------------
// Point d'entrée historique des types du domaine. Conservé pour
// compatibilité ascendante (tout le code existant importe depuis
// '../types/global.types' ou équivalent) : il ne fait plus que
// ré-exporter les modèles désormais organisés par domaine dans
// src/types/models/*.ts, chacun porté par un schéma Zod canonique.
//
// Pour du nouveau code, préférez importer directement depuis le
// module concerné, ex :
//   import { NewsSchema, type News } from '@/types/models/news.types';
// ============================================================

export * from './models/user.types';
export * from './models/common.types';
export * from './models/lien.types';
export * from './models/sondage.types';
export * from './models/commentaire.types';
export * from './models/news.types';
export * from './models/notification.types';
export * from './models/admin.types';
export * from './models/statistiques.types';
