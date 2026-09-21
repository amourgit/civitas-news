// ============================================================
// Helpers PURS de la fiche : brouillon d'édition <-> payload API.
// Mêmes conventions que la création (useCreerOrganisationForm) :
// texte = chaîne rognée ('' si vide), date = null si vide,
// nombre = entier ou null, réseaux = { plateforme: url }.
// ============================================================
import type {
  TenantInformationsPrimaires,
  TenantInformationsPrimairesEcriturePayload,
} from '../../../services/api/repositories/tenants.repository';
import { validateEmail } from '../../../lib/validators';
import type { FicheField, FicheFieldKey, FicheSection } from './organisationFiche.schema';

export interface SocialDraft {
  id: string;
  plateforme: string;
  url: string;
}

export interface SectionDraft {
  values: Record<string, string>;
  socials: SocialDraft[];
}

export function draftFromFiche(section: FicheSection, fiche: TenantInformationsPrimaires): SectionDraft {
  const values: Record<string, string> = {};
  let socials: SocialDraft[] = [];
  for (const field of section.fields) {
    if (field.kind === 'socials') {
      socials = Object.entries(fiche.reseauxSociaux ?? {}).map(([plateforme, url], i) => ({
        id: `${plateforme}-${i}`,
        plateforme,
        url,
      }));
    } else {
      const raw = fiche[field.key];
      values[field.key] = raw === null || raw === undefined ? '' : String(raw);
    }
  }
  return { values, socials };
}

function normalize(field: FicheField, draft: SectionDraft): unknown {
  if (field.kind === 'socials') {
    const out: Record<string, string> = {};
    for (const s of draft.socials) if (s.plateforme && s.url.trim()) out[s.plateforme] = s.url.trim();
    return out;
  }
  const raw = (draft.values[field.key] ?? '').trim();
  if (field.kind === 'date') return raw || null;
  if (field.kind === 'number') {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  }
  return raw;
}

function currentValue(field: FicheField, fiche: TenantInformationsPrimaires): unknown {
  const raw = fiche[field.key];
  if (field.kind === 'socials') return fiche.reseauxSociaux ?? {};
  if (field.kind === 'date' || field.kind === 'number') return raw ?? null;
  return raw ?? '';
}

/** Ne renvoie QUE les champs réellement modifiés (PATCH minimal). */
export function buildSectionPatch(
  section: FicheSection,
  fiche: TenantInformationsPrimaires,
  draft: SectionDraft,
): TenantInformationsPrimairesEcriturePayload {
  const patch: Record<string, unknown> = {};
  for (const field of section.fields) {
    const next = normalize(field, draft);
    if (JSON.stringify(next) !== JSON.stringify(currentValue(field, fiche))) patch[field.key] = next;
  }
  return patch as TenantInformationsPrimairesEcriturePayload;
}

export function validateSectionDraft(section: FicheSection, draft: SectionDraft): Partial<Record<FicheFieldKey, string>> {
  const errors: Partial<Record<FicheFieldKey, string>> = {};
  for (const field of section.fields) {
    const raw = (draft.values[field.key] ?? '').trim();
    if (!raw) continue;
    if (field.kind === 'email' && !validateEmail(raw)) errors[field.key] = 'E-mail invalide.';
    if (field.kind === 'number' && !/^\d+$/.test(raw)) errors[field.key] = 'Nombre entier positif attendu.';
  }
  return errors;
}
