// ============================================================
// src/services/api/utils/urlBuilder.ts
// Construction d'URL absolues à partir d'une base + endpoint +
// paramètres de requête, avec gestion propre des tableaux et
// des slashs.
// ============================================================

export class UrlBuilder {
  /**
   * Construit une URL complète à partir d'une base, d'un endpoint relatif
   * et d'un objet de paramètres optionnel.
   *
   * - Supporte les endpoints absolus (http/https) qui ignorent `baseUrl`.
   * - Les valeurs `undefined`/`null` sont ignorées.
   * - Les tableaux sont sérialisés en répétant la clé (`?tag=a&tag=b`).
   */
  static buildUrl(baseUrl: string, endpoint: string, params?: Record<string, unknown>): string {
    const isAbsolute = /^https?:\/\//i.test(endpoint);
    const base = isAbsolute ? undefined : UrlBuilder.normalizeBase(baseUrl);

    const path = isAbsolute ? endpoint : UrlBuilder.joinPaths(base, endpoint);

    // Utilise un domaine factice quand la base est relative, pour pouvoir
    // s'appuyer sur l'API native `URL`, puis on ne garde que path+query.
    const usesFakeOrigin = !isAbsolute && !/^https?:\/\//i.test(path);
    const url = new URL(path, usesFakeOrigin ? 'http://internal.local' : undefined);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;

        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    }

    return usesFakeOrigin ? `${url.pathname}${url.search}` : url.toString();
  }

  private static normalizeBase(baseUrl: string): string {
    if (!baseUrl) return '';
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  private static joinPaths(base: string | undefined, endpoint: string): string {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    if (!base) return normalizedEndpoint;
    return `${base}${normalizedEndpoint}`;
  }
}
