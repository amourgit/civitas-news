// ============================================================
// src/components/backoffice/users/UserRecordDetail.tsx
// Fiche détail des Utilisateurs (backoffice), branchée via
// ModelDef.RecordExtras + recordViewMode: 'replace' (voir
// utilisateur.registry.ts et BackofficeRecordPage). Remplace le
// Card + formulaire générique EN CONSULTATION par un design de type
// "profil" : bannière dégradée, avatar, statuts, grille d'informations,
// section badges -- plutôt qu'un simple empilement de champs.
//
// L'ÉDITION reste déléguée à BackofficeRecordForm, le même composant
// que pour les 10 autres tables du backoffice : un bouton « Modifier »
// bascule vers ce formulaire dans un Card classique. On ne réinvente
// ni la validation, ni l'appel de sauvegarde, ni la gestion d'erreurs
// -- déjà éprouvés partout ailleurs dans l'app.
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Pencil, Mail, Phone, MapPin, Cake, CalendarDays, Clock,
  Building2, Landmark, Globe, Award, BadgeCheck, BadgeX,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { BackofficeRecordForm } from '../BackofficeRecordForm';
import type { ModelDef } from '../registry/types';
import type { BackendUser } from '../../../types/models/backend.types';
import { ROLE_LABELS } from '../../../lib/constants/userRoles';
import { formatDateFull, formatDateRelative } from '../../../lib/formatDate';
import { referentielsRepository } from '../../../services/api/repositories/referentiels.repository';
import { InitialsAvatar, getInitials, getUserDisplayName } from './InitialsAvatar';

/** Couleur du point associé à chaque rôle dans le badge de la bannière
 * (le fond du badge lui-même reste blanc translucide, pour rester
 * lisible quel que soit le rôle sur le dégradé de marque). */
const ROLE_DOT_COLOR: Record<string, string> = {
  administrateur: 'bg-red-400',
  moderateur: 'bg-amber-400',
  organisation: 'bg-sky-400',
  etudiant: 'bg-emerald-400',
};

function formatDateOnly(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Résout le libellé d'un établissement/organisation par son id --
 * volontairement via le repository (pas via le registre du backoffice)
 * pour ne créer aucune dépendance circulaire avec
 * utilisateur.registry.ts, qui importe ce composant. */
function useReferentielNom(kind: 'etablissement' | 'organisation', id: number | null | undefined) {
  const [nom, setNom] = useState<string | null>(null);

  useEffect(() => {
    setNom(null);
    if (id === null || id === undefined) return undefined;
    let cancelled = false;
    const fetcher = kind === 'etablissement'
      ? referentielsRepository.getEtablissement(String(id))
      : referentielsRepository.getOrganisation(String(id));
    fetcher
      .then((rec) => { if (!cancelled) setNom(rec.nom); })
      .catch(() => { if (!cancelled) setNom(`#${id}`); });
    return () => { cancelled = true; };
  }, [kind, id]);

  return nom;
}

/** Une tuile d'information de la grille -- rendu uniquement si `value`
 * est fourni, pour ne jamais afficher de champ vide dans la grille. */
function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1A1F4D] p-4">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#5B4DFF]/10 text-[#5B4DFF] shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
}

function StatusPill({ children, dotClassName }: { children: React.ReactNode; dotClassName: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white bg-white/15 backdrop-blur-sm border border-white/20">
      <span className={`w-1.5 h-1.5 rounded-full ${dotClassName}`} />
      {children}
    </span>
  );
}

export interface UserRecordDetailProps {
  model: ModelDef<BackendUser>;
  record: BackendUser;
  canManage: boolean;
  onUpdated: (updated: BackendUser) => void;
  onBack: () => void;
}

export default function UserRecordDetail({ model, record, canManage, onUpdated, onBack }: UserRecordDetailProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const name = getUserDisplayName(record);
  const roleLabel = (record.role && ROLE_LABELS[record.role]) || 'Citoyen';
  const roleDot = (record.role && ROLE_DOT_COLOR[record.role]) || 'bg-white';
  const etablissementNom = useReferentielNom('etablissement', record.etablissement ?? null);
  const organisationNom = useReferentielNom('organisation', record.organisation ?? null);

  if (mode === 'edit') {
    return (
      <div className="flex flex-col gap-5 max-w-3xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMode('view')}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Retour à la fiche"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white font-display">Modifier — {name}</h1>
        </div>
        <Card variant="default" padding="lg">
          <BackofficeRecordForm
            model={model}
            record={record}
            canManage={canManage}
            onCancel={() => setMode('view')}
            onSaved={(saved) => {
              onUpdated(saved);
              setMode('view');
            }}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Bannière -- dégradé de marque (voir index.css --civitas-purple /
          --civitas-navy), avatar en initiales, statuts. Retour et
          édition en boutons "glass" flottants pour rester lisibles
          quel que soit le contenu du dégradé en dessous. */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5B4DFF] via-[#7B61FF] to-[#1A1F4D] px-6 py-8 sm:px-10 sm:py-10">
        <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%)]" />
        <div className="relative flex items-start justify-between gap-3">
          <button
            onClick={onBack}
            aria-label="Retour à la liste"
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          {canManage && (
            <Button variant="glass" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => setMode('edit')}>
              Modifier
            </Button>
          )}
        </div>

        <div className="relative flex flex-col items-center text-center mt-2">
          <InitialsAvatar initials={getInitials(name)} sizePx={88} className="border-4 border-white/30 shadow-lg text-2xl" />
          <h1 className="mt-4 text-2xl font-bold text-white font-display truncate max-w-full">{name}</h1>
          <p className="text-sm text-white/70">@{record.username}</p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <StatusPill dotClassName={roleDot}>{roleLabel}</StatusPill>
            <StatusPill dotClassName={record.isActive === false ? 'bg-gray-300' : 'bg-emerald-400'}>
              {record.isActive === false ? 'Inactif' : 'Actif'}
            </StatusPill>
            <StatusPill dotClassName={record.isVerified ? 'bg-sky-400' : 'bg-gray-300'}>
              {record.isVerified ? 'Vérifié' : 'Non vérifié'}
            </StatusPill>
          </div>
        </div>
      </div>

      {/* Grille d'informations -- une tuile par champ renseigné. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <InfoTile icon={Mail} label="Email" value={record.email || 'Non renseigné'} />
        <InfoTile icon={Phone} label="Téléphone" value={record.phoneNumber || 'Non renseigné'} />
        <InfoTile icon={MapPin} label="Adresse" value={record.address || 'Non renseignée'} />
        <InfoTile icon={Cake} label="Date de naissance" value={record.dateOfBirth ? formatDateOnly(record.dateOfBirth) : null} />
        <InfoTile icon={CalendarDays} label="Membre depuis" value={record.dateJoined ? formatDateFull(record.dateJoined) : null} />
        <InfoTile icon={Clock} label="Dernière connexion" value={record.lastLogin ? formatDateRelative(record.lastLogin) : 'Jamais connecté'} />
        <InfoTile icon={Building2} label="Établissement" value={etablissementNom} />
        <InfoTile icon={Landmark} label="Organisation" value={organisationNom} />
        <InfoTile
          icon={Globe}
          label="Langue & fuseau horaire"
          value={[record.languagePreference, record.timezone].filter(Boolean).join(' · ') || null}
        />
      </div>

      {/* Badges -- uniquement si l'utilisateur en possède au moins un. */}
      {record.badges && record.badges.length > 0 && (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1A1F4D] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-[#5B4DFF]" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Badges</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {record.badges.map((badge) => (
              <span
                key={badge.id}
                title={badge.description}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#5B4DFF]/10 text-[#5B4DFF] dark:bg-[#5B4DFF]/20"
              >
                <span aria-hidden>{badge.icone}</span>
                {badge.nom}
              </span>
            ))}
          </div>
        </div>
      )}

      {record.isVerified === false && (
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 px-1">
          <BadgeX className="w-3.5 h-3.5" />
          Compte non vérifié -- certaines actions peuvent être limitées côté produit.
        </div>
      )}
      {record.isVerified && (
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 px-1">
          <BadgeCheck className="w-3.5 h-3.5 text-sky-500" />
          Identité vérifiée.
        </div>
      )}
    </div>
  );
}
