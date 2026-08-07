// ============================================================
// src/types/models/lien.types.ts
// Domaine Liens de publication (partage public/privé d'une news,
// QR code, scope de diffusion).
// ============================================================

import { z } from 'zod';

export const LienScopeSchema = z.object({
  etablissement: z.string().optional(),
  province: z.string().optional(),
  promotion: z.string().optional(),
  organisation: z.string().optional(),
  classe: z.string().optional(),
});
export type LienScope = z.infer<typeof LienScopeSchema>;

export const LienPublicationSchema = z.object({
  id: z.string(),
  newsId: z.string(),
  sujetId: z.string().optional(),
  urlPublique: z.string(),
  urlCourte: z.string().optional(),
  // get_qr_code renvoie None si pas encore généré -> null JSON.
  qrCode: z.string().nullable().optional(),
  visibilite: z.enum(['public', 'prive', 'limite']),
  motDePasse: z.boolean().optional(),
  expiration: z.string().optional(),
  usageUnique: z.boolean().optional(),
  // get_scope renvoie None si aucune restriction de portée -> null JSON.
  scope: LienScopeSchema.nullable().optional(),
  clics: z.number().int().nonnegative().optional(),
  scans: z.number().int().nonnegative().optional(),
  createdAt: z.string(),
});
export type LienPublication = z.infer<typeof LienPublicationSchema>;
