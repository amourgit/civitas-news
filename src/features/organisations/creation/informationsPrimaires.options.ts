// ============================================================
// src/features/organisations/creation/informationsPrimaires.options.ts
// Listes fixes reprises À L'IDENTIQUE des `TextChoices` backend
// (tenants/models.py : FormeJuridique, SecteurActivite, ProvinceGabon)
// -- la `value` envoyée à l'API doit correspondre EXACTEMENT à la
// valeur du choix Django, jamais reconstruite/devinée ici.
// ============================================================

import type { FieldOption } from '../../../components/backoffice/registry/types';

/** `tenants.models.FormeJuridique` */
export const FORME_JURIDIQUE_OPTIONS: FieldOption[] = [
  { value: 'association', label: 'Association' },
  { value: 'ong', label: 'ONG' },
  { value: 'etablissement_public', label: 'Établissement public' },
  { value: 'etablissement_prive', label: 'Établissement privé' },
  { value: 'ministere_administration', label: 'Ministère / Administration publique' },
  { value: 'entreprise_privee', label: 'Entreprise privée' },
  { value: 'entreprise_publique', label: 'Entreprise publique / parapublique' },
  { value: 'mutuelle', label: 'Mutuelle' },
  { value: 'media', label: 'Média' },
  { value: 'autre', label: 'Autre' },
];

/** `tenants.models.SecteurActivite` */
export const SECTEUR_ACTIVITE_OPTIONS: FieldOption[] = [
  { value: 'education_formation', label: 'Éducation / Formation' },
  { value: 'sante', label: 'Santé' },
  { value: 'administration_publique', label: 'Administration publique' },
  { value: 'media_communication', label: 'Média / Communication' },
  { value: 'associatif_humanitaire', label: 'Associatif / Humanitaire' },
  { value: 'economie_finance', label: 'Économie / Finance' },
  { value: 'protection_sociale', label: 'Protection sociale / Mutualité' },
  { value: 'autre', label: 'Autre' },
];

/** `tenants.models.ProvinceGabon` -- les 9 provinces du Gabon. */
export const PROVINCE_GABON_OPTIONS: FieldOption[] = [
  { value: 'estuaire', label: 'Estuaire' },
  { value: 'haut_ogooue', label: 'Haut-Ogooué' },
  { value: 'moyen_ogooue', label: 'Moyen-Ogooué' },
  { value: 'ngounie', label: 'Ngounié' },
  { value: 'nyanga', label: 'Nyanga' },
  { value: 'ogooue_ivindo', label: 'Ogooué-Ivindo' },
  { value: 'ogooue_lolo', label: 'Ogooué-Lolo' },
  { value: 'ogooue_maritime', label: 'Ogooué-Maritime' },
  { value: 'woleu_ntem', label: 'Woleu-Ntem' },
];

/**
 * Plateformes de réseaux sociaux proposées pour `reseaux_sociaux`
 * (dictionnaire libre {plateforme: url} côté backend -- voir
 * `TenantInformationsPrimaires.reseaux_sociaux`). Volontairement des
 * clés en un seul mot minuscule : le `CamelCaseJSONParser` backend
 * convertit récursivement les clés de TOUT objet JSON imbriqué --
 * un mot sans frontière de casse traverse cette conversion sans être
 * altéré, ce qui n'est pas garanti pour une clé composée.
 */
export const RESEAU_SOCIAL_OPTIONS: FieldOption[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'autre', label: 'Autre' },
];

export function libelleOption(options: FieldOption[], value: string | undefined): string | undefined {
  if (!value) return undefined;
  return options.find((o) => o.value === value)?.label;
}
