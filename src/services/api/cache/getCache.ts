// ============================================================
// src/services/api/cache/getCache.ts
// Cache mémoire (durée de vie = onglet) pour les réponses GET, EXTRAIT
// dans son propre module plutôt que privé à GetService : ça permet à
// authFetchInterceptor.ts (et au chemin XHR d'upload de PostService,
// qui ne passe pas par fetch/l'intercepteur) de le VIDER après toute
// mutation réussie (POST/PUT/PATCH/DELETE), sans faire dépendre ces
// fichiers de tout HttpServiceFactory/httpClient pour ça -- seul point
// de couplage entre lecture (GetService) et invalidation (mutations),
// volontairement minimal.
//
// Politique d'invalidation : brutale (clear() intégral, jamais ciblé
// par endpoint) -- une réponse GET jamais périmée de plus de quelques
// secondes après une écriture vaut largement mieux qu'une invalidation
// fine mais fragile à tenir à jour à chaque nouveau repository. Le
// coût (quelques cache-miss de plus juste après une mutation) est
// négligeable face au risque d'oublier un cas et d'afficher des
// données obsolètes indéfiniment.
// ============================================================

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

// Garde-fou anti-fuite mémoire sur une session longue (plusieurs
// tenants/utilisateurs enchaînés dans le même onglet, voir la clé de
// cache dans GetService qui inclut tenant+token) : pas besoin d'un
// vrai LRU, une éviction FIFO simple suffit à borner la taille.
const MAX_ENTRIES = 300;

class GetCacheStore {
  private readonly store = new Map<string, CacheEntry>();

  /**
   * Entrée BRUTE (avec timestamp/ttl), y compris si périmée -- à la
   * différence d'un simple `get()`, ne supprime PAS une entrée juste
   * expirée : c'est GetService (stale-while-revalidate) qui décide si
   * une entrée périmée mais encore dans sa fenêtre de grâce doit être
   * resservie telle quelle pendant un rafraîchissement silencieux en
   * arrière-plan. Purgée seulement au-delà de 2x sa propre durée de
   * vie -- au-delà, plus personne ne la resservira jamais, autant
   * libérer la mémoire.
   */
  getEntry(key: string): CacheEntry | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > entry.ttl * 2) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  set(key: string, data: unknown, ttlMs: number): void {
    if (ttlMs <= 0) return;
    if (!this.store.has(key) && this.store.size >= MAX_ENTRIES) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) this.store.delete(oldestKey);
    }
    this.store.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
  }

  /** Vide tout le cache -- appelé après toute mutation réussie vers notre API. */
  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }
}

/** Instance unique partagée -- voir l'en-tête du fichier. */
export const getCacheStore = new GetCacheStore();
