// ============================================================
// src/components/editor/pendingMediaRegistry.ts
// Un News en cours de création n'a pas encore d'id backend : les
// médias insérés dans l'éditeur avant publication ne peuvent donc pas
// être persistés tout de suite (les endpoints NewsMediaViewSet /
// DocumentJointViewSet exigent `news` en base). On les garde en
// mémoire locale (aperçu via URL.createObjectURL) et on les persiste
// réellement une fois l'id de la News connu (voir mediaPersistence.ts:
// flushPendingMedia, appelé par RichTextEditor.publishPendingMedia).
//
// Une instance par éditeur monté (créée dans RichTextEditor via
// useRef) -- jamais un singleton global, pour éviter qu'un brouillon
// abandonné sur une page laisse traîner des fichiers réclamés par un
// autre éditeur ouvert ailleurs dans l'app.
// ============================================================

export interface PendingMediaEntry {
  file: File;
  /** Aperçu local -- révoqué explicitement via `release()` pour éviter les fuites mémoire. */
  objectUrl: string;
}

export class PendingMediaRegistry {
  private entries = new Map<string, PendingMediaEntry>();
  private counter = 0;

  /** Enregistre un fichier local et renvoie son identifiant temporaire + son URL d'aperçu. */
  register(file: File): { tempId: string; objectUrl: string } {
    const tempId = `pending-${Date.now()}-${(this.counter += 1)}`;
    const objectUrl = URL.createObjectURL(file);
    this.entries.set(tempId, { file, objectUrl });
    return { tempId, objectUrl };
  }

  get(tempId: string): PendingMediaEntry | undefined {
    return this.entries.get(tempId);
  }

  /** Libère l'URL d'objet et oublie l'entrée (après persistance réussie, ou annulation). */
  release(tempId: string): void {
    const entry = this.entries.get(tempId);
    if (entry) {
      URL.revokeObjectURL(entry.objectUrl);
      this.entries.delete(tempId);
    }
  }

  /** Appelé au démontage de l'éditeur pour ne pas fuiter les URLs d'objet restantes. */
  releaseAll(): void {
    this.entries.forEach((entry) => URL.revokeObjectURL(entry.objectUrl));
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}
