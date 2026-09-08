// ============================================================
// src/features/news/creation/types.ts
// Types partagés entre les composants du nouvel assistant de création
// (voir useNewsCreationForm.ts, MediaGallerySection.tsx).
// ============================================================

/** Bascule du niveau 1 de la topbar (voir ModeToggle.tsx). Le mode
 * "avance" (canevas libre façon Figma) est volontairement hors
 * périmètre de cette itération -- voir AdvancedModePlaceholder.tsx. */
export type CreationMode = 'standard' | 'avance';

/**
 * Image de galerie pas encore envoyée au backend (la News n'existe pas
 * encore -- voir newsAssets.repository.ts:newsGalerieRepository, qui
 * exige un `newsId` réel). Publiée juste après la création, sur le
 * même principe que `RichTextEditor.publishPendingMedia`.
 */
export interface PendingGalleryItem {
  tempId: string;
  file: File;
  previewUrl: string;
  legende: string;
}

/** Document joint pas encore envoyé, même logique que PendingGalleryItem. */
export interface PendingDocumentItem {
  tempId: string;
  file: File;
  nom: string;
}

/** Réglages de diffusion -- le "bref composant" de la topbar (niveau
 * inférieur) : équivalent du sélecteur d'audience façon Facebook,
 * mais couvrant aussi le statut de publication (brouillon/publié)
 * quand l'utilisateur n'a pas la permission de publier directement. */
export interface PublishSettings {
  visibilite: 'public' | 'prive' | 'limite';
  statut: 'brouillon' | 'publie';
}
