// ============================================================
// src/components/editor/types.ts
// Attributs communs à tous les nœuds média custom de l'éditeur riche
// (ImageBlock, VideoBlock, FileAttachment, éléments d'une Gallery).
// ============================================================

export type MediaAlign = 'left' | 'center' | 'right' | 'wide';

/**
 * Un média référencé dans le contenu peut se trouver dans 3 états :
 *  1. pending=true, mediaId=null  -> fichier local pas encore envoyé
 *     (News en cours de création, pas encore d'id backend). `src` est
 *     une URL d'objet locale (blob:) valable pour la session en cours.
 *  2. pending=false, mediaId=<id> -> persistée en base, `src` est
 *     l'URL réelle (ex: S3 / media backend) renvoyée par l'API.
 *  3. failed=true -> une tentative de persistance a échoué (le nœud
 *     garde son aperçu local + un bouton « réessayer »).
 */
export interface MediaNodeAttrs {
  src: string;
  mediaId: string | null;
  tempId: string | null;
  pending: boolean;
  failed?: boolean;
}

export interface ImageNodeAttrs extends MediaNodeAttrs {
  alt: string;
  caption: string;
  credit: string;
  align: MediaAlign;
  width: number | null;
  height: number | null;
}

export interface VideoNodeAttrs extends MediaNodeAttrs {
  caption: string;
  poster: string | null;
}

export interface FileAttachmentAttrs extends MediaNodeAttrs {
  nom: string;
  taille: number | null;
  type: string | null;
}

export interface GalleryItem extends MediaNodeAttrs {
  alt: string;
  caption: string;
}

export interface GalleryNodeAttrs {
  items: GalleryItem[];
}

/**
 * Pas de flux pending/upload pour YouTube : le videoId embarqué dans
 * le contenu EST la référence durable (hébergée par YouTube, aucune
 * copie locale à persister côté CIVITAS), contrairement à un fichier
 * local qui doit transiter par le backend avant d'avoir une URL
 * stable.
 */
export interface YoutubeNodeAttrs {
  videoId: string;
  caption: string;
}

export type CalloutVariant = 'info' | 'success' | 'warning' | 'danger';

export interface CalloutNodeAttrs {
  variant: CalloutVariant;
}
