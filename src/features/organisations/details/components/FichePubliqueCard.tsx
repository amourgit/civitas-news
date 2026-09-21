// ============================================================
// Extrait PUBLIC de la fiche d'une organisation (`fichePublique`,
// liste blanche côté backend) : affiché à quiconque consulte
// l'organisation sans en être administrateur. Aucune donnée
// légale/personnelle ici -- elles n'arrivent même pas du serveur.
// ============================================================
import React from 'react';
import { BadgeCheck, Globe } from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import type { TenantFichePublique } from '../../../../services/api/repositories/tenants.repository';
import {
  FORME_JURIDIQUE_OPTIONS,
  SECTEUR_ACTIVITE_OPTIONS,
  PROVINCE_GABON_OPTIONS,
  RESEAU_SOCIAL_OPTIONS,
  libelleOption,
} from '../../creation/informationsPrimaires.options';

export const FichePubliqueCard: React.FC<{ fiche: TenantFichePublique }> = ({ fiche }) => {
  const localisation = [fiche.ville, libelleOption(PROVINCE_GABON_OPTIONS, fiche.province ?? undefined) ?? fiche.province, fiche.pays]
    .filter(Boolean)
    .join(', ');
  const rows: Array<[string, React.ReactNode]> = [
    ['Raison sociale', fiche.raisonSociale && `${fiche.raisonSociale}${fiche.sigle ? ` (${fiche.sigle})` : ''}`],
    ['Forme juridique', libelleOption(FORME_JURIDIQUE_OPTIONS, fiche.formeJuridique ?? undefined)],
    ['Secteur d’activité', libelleOption(SECTEUR_ACTIVITE_OPTIONS, fiche.secteurActivite ?? undefined)],
    ['Localisation', localisation],
    ['Zone de couverture', fiche.zoneCouverture],
    ['Site web', fiche.siteWeb && (
      <a className="inline-flex items-center gap-1 break-all text-[#5B4DFF] hover:underline" href={fiche.siteWeb} target="_blank" rel="noopener noreferrer">
        <Globe className="h-3.5 w-3.5 shrink-0" /> {fiche.siteWeb}
      </a>
    )],
    ['Activités', fiche.descriptionActivites && <span className="whitespace-pre-line">{fiche.descriptionActivites}</span>],
  ];
  const visibles = rows.filter(([, value]) => !!value);
  const reseaux = Object.entries(fiche.reseauxSociaux ?? {});
  if (!visibles.length && !reseaux.length) return null;

  return (
    <section className="rounded-3xl border border-gray-200 bg-white/70 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-6">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="font-display text-base font-bold text-gray-900 dark:text-white">Informations publiques</h2>
        {fiche.identiteVerifiee && (
          <Badge variant="success" size="sm"><BadgeCheck className="h-3 w-3" /> Identité vérifiée</Badge>
        )}
      </header>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        {visibles.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
            <dd className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">{value}</dd>
          </div>
        ))}
        {reseaux.length > 0 && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-gray-500 dark:text-gray-400">Réseaux sociaux</dt>
            <dd className="mt-1 flex flex-wrap gap-2">
              {reseaux.map(([plateforme, url]) => (
                <a key={plateforme} href={url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-[#5B4DFF] hover:bg-[#5B4DFF]/10 dark:border-white/10">
                  {libelleOption(RESEAU_SOCIAL_OPTIONS, plateforme) ?? plateforme}
                </a>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
};
