// ============================================================
// src/components/editor/mediaPersistence.ts
// Persistance des médias insérés dans le contenu riche d'une News.
// Réutilise EXACTEMENT les endpoints déjà en place pour l'onglet
// "Médias" du backoffice (voir services/api/repositories/
// newsAssets.repository.ts : NewsMediaViewSet / DocumentJointViewSet,
// news requis en base) -- aucune modification backend n'est requise
// pour que l'éditeur riche fonctionne de bout en bout : une image
// insérée dans le contenu devient une NewsMediaItem (type='image')
// comme n'importe quel autre média rattaché à cette News.
// ============================================================

import type { Editor } from '@tiptap/core';
import { env } from '../../config/env';
import {
  newsMediasRepository,
  newsDocumentsRepository,
} from '../../services/api/repositories/newsAssets.repository';
import { PendingMediaRegistry } from './pendingMediaRegistry';

export interface PersistedMediaResult {
  mediaId: string;
  url: string;
}

export interface PersistedDocumentResult extends PersistedMediaResult {
  taille: number;
  type: string;
}

/** Lit les dimensions réelles d'une image locale avant upload -- évite
 * tout décalage de mise en page (CLS) une fois l'image affichée en
 * lecture, la largeur/hauteur étant déjà connues dans l'attribut du
 * nœud avant même que l'URL persistée ne soit chargée. */
export function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    img.src = objectUrl;
  });
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '';
  const units = ['o', 'Ko', 'Mo', 'Go'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

async function uploadImageOrVideo(params: {
  newsId: string;
  file: File;
  type: 'image' | 'video';
  titre: string;
  description?: string;
}): Promise<PersistedMediaResult> {
  if (env.useMockData) {
    return { mediaId: `mock-media-${Date.now()}`, url: URL.createObjectURL(params.file) };
  }
  const media = await newsMediasRepository.create({
    newsId: params.newsId,
    type: params.type,
    fichier: params.file,
    titre: params.titre,
    description: params.description,
  });
  return { mediaId: media.id, url: media.url };
}

export const uploadImageMedia = (params: { newsId: string; file: File; titre: string; description?: string }) =>
  uploadImageOrVideo({ ...params, type: 'image' });

export const uploadVideoMedia = (params: { newsId: string; file: File; titre: string; description?: string }) =>
  uploadImageOrVideo({ ...params, type: 'video' });

export async function registerYoutubeMedia(params: { newsId: string; url: string; titre: string }): Promise<PersistedMediaResult> {
  if (env.useMockData) {
    return { mediaId: `mock-media-${Date.now()}`, url: params.url };
  }
  const media = await newsMediasRepository.create({
    newsId: params.newsId,
    type: 'youtube',
    urlExterne: params.url,
    titre: params.titre,
  });
  return { mediaId: media.id, url: media.url };
}

export async function uploadDocumentMedia(params: { newsId: string; file: File; nom?: string }): Promise<PersistedDocumentResult> {
  if (env.useMockData) {
    return {
      mediaId: `mock-doc-${Date.now()}`,
      url: URL.createObjectURL(params.file),
      taille: params.file.size,
      type: params.file.type || 'application/octet-stream',
    };
  }
  const doc = await newsDocumentsRepository.create(params.newsId, params.file, params.nom);
  return { mediaId: doc.id, url: doc.url, taille: doc.taille, type: doc.type };
}

/**
 * Parcourt le document Tiptap courant, envoie chaque média encore
 * `pending` (ImageBlock / VideoBlock / FileAttachment / éléments d'une
 * Gallery) au backend maintenant que `newsId` est connu, et met à jour
 * les attributs du nœud en place (recherche par `tempId` à chaque
 * itération plutôt que par position ProseMirror figée -- une position
 * capturée avant l'upload précédent peut ne plus être valide après
 * qu'une transaction a modifié le document). Les échecs individuels
 * n'interrompent pas le parcours : le nœud concerné passe `failed:true`
 * (aperçu local conservé) et son décompte est renvoyé à l'appelant.
 */
/**
 * Persiste un unique média en attente (identifié par son `tempId`) et
 * répercute le résultat sur le nœud correspondant. Renvoie `true` en
 * cas de succès. Utilisé aussi bien pour l'upload immédiat à
 * l'insertion (mode édition, `newsId` déjà connu) que pour chaque
 * itération de `flushPendingMedia` (mode création, à la publication).
 */
export async function persistPendingByTempId(
  editor: Editor,
  registry: PendingMediaRegistry,
  newsId: string,
  tempId: string,
): Promise<boolean> {
  const entry = registry.get(tempId);
  if (!entry) return false;

  try {
    let result: PersistedMediaResult | PersistedDocumentResult;
    const nodeType = findNodeTypeForTempId(editor, tempId);

    if (nodeType === 'videoBlock') {
      result = await uploadVideoMedia({ newsId, file: entry.file, titre: entry.file.name });
    } else if (nodeType === 'fileAttachment') {
      result = await uploadDocumentMedia({ newsId, file: entry.file, nom: entry.file.name });
    } else {
      result = await uploadImageMedia({ newsId, file: entry.file, titre: entry.file.name });
    }

    applyPersistedResult(editor, tempId, result);
    registry.release(tempId);
    return true;
  } catch (error) {
    console.error(`Échec de la persistance du média ${tempId} :`, error);
    markNodeFailed(editor, tempId);
    return false;
  }
}

export async function flushPendingMedia(
  editor: Editor,
  registry: PendingMediaRegistry,
  newsId: string,
): Promise<{ uploaded: number; failed: number }> {
  const pendingTempIds: string[] = [];
  editor.state.doc.descendants((node) => {
    if (node.attrs && node.attrs.pending && node.attrs.tempId) {
      pendingTempIds.push(node.attrs.tempId as string);
    }
    if (node.type.name === 'galleryBlock' && Array.isArray(node.attrs.items)) {
      (node.attrs.items as { pending?: boolean; tempId?: string | null }[]).forEach((item) => {
        if (item.pending && item.tempId) pendingTempIds.push(item.tempId);
      });
    }
  });

  let uploaded = 0;
  let failed = 0;

  for (const tempId of pendingTempIds) {
    const ok = await persistPendingByTempId(editor, registry, newsId, tempId);
    if (ok) uploaded += 1;
    else failed += 1;
  }

  return { uploaded, failed };
}

function findNodeTypeForTempId(editor: Editor, tempId: string): string | null {
  let found: string | null = null;
  editor.state.doc.descendants((node) => {
    if (found) return false;
    if (node.attrs?.tempId === tempId) {
      found = node.type.name;
      return false;
    }
    if (node.type.name === 'galleryBlock' && Array.isArray(node.attrs.items)) {
      const match = (node.attrs.items as { tempId?: string | null }[]).some((item) => item.tempId === tempId);
      if (match) found = 'galleryBlock';
    }
    return true;
  });
  return found;
}

function applyPersistedResult(editor: Editor, tempId: string, result: PersistedMediaResult | PersistedDocumentResult) {
  const { state, view } = editor;
  const tr = state.tr;
  let changed = false;

  state.doc.descendants((node, pos) => {
    if (node.attrs?.tempId === tempId) {
      const extra = 'taille' in result ? { taille: result.taille, type: result.type } : {};
      tr.setNodeAttribute(pos, 'mediaId', result.mediaId);
      tr.setNodeAttribute(pos, 'src', result.url);
      tr.setNodeAttribute(pos, 'pending', false);
      tr.setNodeAttribute(pos, 'failed', false);
      Object.entries(extra).forEach(([key, value]) => tr.setNodeAttribute(pos, key, value));
      changed = true;
    } else if (node.type.name === 'galleryBlock' && Array.isArray(node.attrs.items)) {
      const items = node.attrs.items as (typeof node.attrs.items)[number][];
      const nextItems = items.map((item: Record<string, unknown>) =>
        item.tempId === tempId
          ? { ...item, mediaId: result.mediaId, src: result.url, pending: false, failed: false }
          : item,
      );
      tr.setNodeAttribute(pos, 'items', nextItems);
      changed = true;
    }
  });

  if (changed) view.dispatch(tr);
}

/** Remet un nœud en état "en cours d'import" avant de relancer une tentative (bouton « Réessayer »). */
export function setPendingByTempId(editor: Editor, tempId: string): void {
  const { state, view } = editor;
  const tr = state.tr;
  let changed = false;

  state.doc.descendants((node, pos) => {
    if (node.attrs?.tempId === tempId) {
      tr.setNodeAttribute(pos, 'failed', false);
      tr.setNodeAttribute(pos, 'pending', true);
      changed = true;
    } else if (node.type.name === 'galleryBlock' && Array.isArray(node.attrs.items)) {
      const items = node.attrs.items as (typeof node.attrs.items)[number][];
      const nextItems = items.map((item: Record<string, unknown>) =>
        item.tempId === tempId ? { ...item, failed: false, pending: true } : item,
      );
      tr.setNodeAttribute(pos, 'items', nextItems);
      changed = true;
    }
  });

  if (changed) view.dispatch(tr);
}

function markNodeFailed(editor: Editor, tempId: string) {
  const { state, view } = editor;
  const tr = state.tr;
  let changed = false;

  state.doc.descendants((node, pos) => {
    if (node.attrs?.tempId === tempId) {
      tr.setNodeAttribute(pos, 'failed', true);
      changed = true;
    } else if (node.type.name === 'galleryBlock' && Array.isArray(node.attrs.items)) {
      const items = node.attrs.items as (typeof node.attrs.items)[number][];
      const nextItems = items.map((item: Record<string, unknown>) =>
        item.tempId === tempId ? { ...item, failed: true } : item,
      );
      tr.setNodeAttribute(pos, 'items', nextItems);
      changed = true;
    }
  });

  if (changed) view.dispatch(tr);
}
