// ============================================================
// src/components/backoffice/users/UserRecordDetail.tsx
// Fiche détail des Utilisateurs (backoffice), branchée via
// ModelDef.RecordExtras + recordViewMode: 'replace' (voir
// utilisateur.registry.ts et BackofficeRecordPage). Design "profil" :
// bannière dégradée, avatar, statuts, grille d'informations, section
// badges.
//
// L'ÉDITION ne bascule PLUS vers BackofficeRecordForm/un Card générique
// (« façon Django », trop simple) : au clic sur « Modifier », ce sont
// LES MÊMES cadres (tuiles de la grille, pastilles de statut de la
// bannière) qui deviennent directement des champs modifiables, sans
// changer de mise en page. Un seul état `values` (voir
// buildInitialValues, partagé avec BackofficeRecordForm/
// BackofficeEditableCell) couvre tous les champs ; « Enregistrer »
// envoie exactement le même payload à model.data.update que les deux
// autres façons d'éditer un enregistrement du backoffice.
//
// Le mot de passe n'a PAS de champ dans le registre (l'API ne renvoie
// ni n'accepte jamais de mot de passe en clair, et l'action backend
// change_password exige l'ancien mot de passe -- inutilisable pour un
// modérateur/admin réinitialisant le compte de quelqu'un d'autre) :
// sa tuile reste donc volontairement statique et grisée, en
// consultation COMME en édition, avec des points à la place d'un
// contenu qui n'existe nulle part côté frontend.
// ============================================================

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Pencil, Mail, Phone, MapPin, Cake, CalendarDays, Clock,
  Building2, Landmark, Globe, Award, BadgeCheck, BadgeX, Lock, Save,
  ChevronDown, Check,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { FkSelectField } from '../fields/FkSelectField';
import { InlineCellPopover } from '../fields/InlineCellPopover';
import type { ModelDef } from '../registry/types';
import type { BackendUser } from '../../../types/models/backend.types';
import { ROLE_LABELS } from '../../../lib/constants/userRoles';
import { formatDateFull, formatDateRelative } from '../../../lib/formatDate';
import { referentielsRepository } from '../../../services/api/repositories/referentiels.repository';
import { toast } from '../../../hooks/useToast';
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

/** Va chercher la déclaration d'un champ dans le registre par son nom
 * (options du select rôle, fkTarget établissement/organisation…) --
 * évite de dupliquer cette config directement dans ce composant. */
function getField<TRecord extends Record<string, unknown>>(model: ModelDef<TRecord>, name: string) {
  return model.fields.find((f) => f.name === name);
}

/** Construit l'état de formulaire du mode édition DIRECTEMENT depuis
 * `record` (typé BackendUser), plutôt que via l'utilitaire générique
 * `buildInitialValues(model.fields, record)` piloté par la déclaration
 * du registre : ce composant est spécifique à Utilisateur (pas
 * générique comme BackofficeRecordForm), et référence directement
 * chacun de ces champs (pastilles de statut incluses) -- les seeder
 * depuis le `record` réel garantit qu'ils reflètent toujours l'état
 * courant, y compris si un champ venait à manquer côté registre. */
function buildEditValues(record: BackendUser): Record<string, unknown> {
  return {
    firstName: record.firstName ?? '',
    lastName: record.lastName ?? '',
    email: record.email ?? '',
    phoneNumber: record.phoneNumber ?? '',
    address: record.address ?? '',
    dateOfBirth: record.dateOfBirth ? record.dateOfBirth.slice(0, 10) : '',
    role: record.role ?? '',
    etablissement: record.etablissement === null || record.etablissement === undefined ? undefined : String(record.etablissement),
    organisation: record.organisation === null || record.organisation === undefined ? undefined : String(record.organisation),
    isActive: record.isActive !== false,
    isVerified: Boolean(record.isVerified),
  };
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
 * est fourni, pour ne jamais afficher de champ vide dans la grille.
 * Purement consultative (aucun champ éditable dans le registre pour
 * ce qu'elle affiche -- Membre depuis, Dernière connexion, Langue). */
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

/** Même cadre que InfoTile, mais dont le contenu bascule vers un
 * champ modifiable (`children`) quand `mode === 'edit'` -- c'est CE
 * composant qui réalise la demande « les mêmes cadres d'affichage
 * deviennent des champs possibles à modifier ». En consultation,
 * masqué si `viewValue` est vide (même règle que InfoTile) ; en
 * édition, toujours affiché pour permettre de renseigner un champ
 * actuellement vide (ex : une adresse pas encore saisie). */
function EditableInfoTile({
  icon: Icon,
  label,
  mode,
  viewValue,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  mode: 'view' | 'edit';
  viewValue: React.ReactNode;
  children: React.ReactNode;
}) {
  if (mode === 'view' && !viewValue) return null;
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1A1F4D] p-4">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#5B4DFF]/10 text-[#5B4DFF] shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500">{label}</p>
        {mode === 'view' ? (
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{viewValue}</p>
        ) : (
          <div className="mt-0.5">{children}</div>
        )}
      </div>
    </div>
  );
}

const editInputClass =
  'w-full bg-transparent text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:font-normal outline-none border-b border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-[#5B4DFF] transition-colors py-0.5 disabled:opacity-60';

/** Tuile « Mot de passe » -- volontairement TOUJOURS statique et
 * grisée, en consultation comme en édition (voir bandeau du fichier :
 * aucun champ mot de passe dans le registre, aucune action backend
 * exploitable pour un reset par un tiers). */
function PasswordInfoTile() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#1A1F4D]/50 p-4 opacity-70">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-400 shrink-0">
        <Lock className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 dark:text-gray-500">Mot de passe</p>
        <p className="text-sm font-semibold tracking-widest text-gray-400 dark:text-gray-500 select-none">••••••••</p>
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

/** Pastille de statut cliquable (Actif/Inactif, Vérifié/Non vérifié) --
 * EXACTEMENT le même habillage visuel que StatusPill (même « cadre »),
 * juste rendue interactive en mode édition : un clic bascule
 * localement la valeur, enregistrée avec le reste au clic sur
 * « Enregistrer ». */
function TogglePill({
  active, dotOn, dotOff, labelOn, labelOff, onToggle, disabled,
}: {
  active: boolean;
  dotOn: string;
  dotOff: string;
  labelOn: string;
  labelOff: string;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white bg-white/15 backdrop-blur-sm border border-white/20 hover:bg-white/25 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? dotOn : dotOff}`} />
      {active ? labelOn : labelOff}
    </button>
  );
}

/** Pastille de rôle en mode édition -- même habillage que StatusPill,
 * mais déclenche un menu déroulant (les options du champ `role` du
 * registre) via le même mécanisme de popover portail que
 * InlineSelectField/FkSelectField (voir InlineCellPopover) : le
 * panneau est rendu hors du dégradé de la bannière, donc son propre
 * contraste clair/sombre reste intact quel que soit le fond derrière
 * le déclencheur. */
function RolePillEditor({
  options, value, dotClassName, onChange, disabled,
}: {
  options: { value: string; label: string }[];
  value: string | undefined;
  dotClassName: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <InlineCellPopover
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      disabled={disabled}
      panelMinWidth={176}
      trigger={
        <button
          type="button"
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white bg-white/15 backdrop-blur-sm border border-white/20 hover:bg-white/25 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${dotClassName}`} />
          {selected?.label ?? 'Sélectionner…'}
          <ChevronDown className="w-3 h-3 opacity-70" />
        </button>
      }
    >
      <div className="max-h-56 overflow-y-auto py-1">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              setIsOpen(false);
            }}
            className={`w-full text-left px-3 py-2 text-sm truncate transition-colors flex items-center justify-between gap-2 ${
              option.value === value
                ? 'bg-[#5B4DFF]/10 text-[#5B4DFF] font-semibold'
                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <span className="truncate">{option.label}</span>
            {option.value === value && <Check className="w-3.5 h-3.5 shrink-0" />}
          </button>
        ))}
      </div>
    </InlineCellPopover>
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
  const [values, setValues] = useState<Record<string, unknown>>(() => buildEditValues(record));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEdit = mode === 'edit';

  const setFieldValue = (name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const startEdit = () => {
    setValues(buildEditValues(record));
    setFormError(null);
    setMode('edit');
  };

  const cancelEdit = () => {
    setFormError(null);
    setMode('view');
  };

  const handleSave = async () => {
    setFormError(null);
    const missing = model.fields.find(
      (f) => f.required && !f.readOnly && !f.hiddenInForm && (values[f.name] === undefined || values[f.name] === ''),
    );
    if (missing) {
      setFormError(`Le champ « ${missing.label} » est requis.`);
      return;
    }
    if (!model.data.update) {
      setFormError('Cette opération n’est pas disponible pour cette table.');
      return;
    }
    setIsSubmitting(true);
    try {
      const saved = await model.data.update(String(record.id), values);
      toast('success', `${model.labelSingular} mis(e) à jour`);
      onUpdated(saved);
      setMode('view');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue.';
      setFormError(message);
      toast('error', 'Échec de l’enregistrement', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Valeurs "live" : en édition, dérivées de `values` (donc mises à
  // jour à chaque frappe/sélection) ; en consultation, celles du
  // `record` reçu -- un seul jeu de variables consommé plus bas, quel
  // que soit le mode.
  const liveFirstName = isEdit ? (values.firstName as string | undefined) : record.firstName;
  const liveLastName = isEdit ? (values.lastName as string | undefined) : record.lastName;
  const name = getUserDisplayName({ ...record, firstName: liveFirstName, lastName: liveLastName });
  const currentRole = (isEdit ? (values.role as string | undefined) : record.role) ?? undefined;
  const currentIsActive = isEdit ? Boolean(values.isActive) : record.isActive !== false;
  const currentIsVerified = isEdit ? Boolean(values.isVerified) : Boolean(record.isVerified);
  const roleLabel = (currentRole && ROLE_LABELS[currentRole]) || 'Citoyen';
  const roleDot = (currentRole && ROLE_DOT_COLOR[currentRole]) || 'bg-white';
  const etablissementNom = useReferentielNom('etablissement', record.etablissement ?? null);
  const organisationNom = useReferentielNom('organisation', record.organisation ?? null);

  const roleField = getField(model, 'role');
  const etablissementField = getField(model, 'etablissement');
  const organisationField = getField(model, 'organisation');

  return (
    <div className="flex flex-col gap-5">
      {/* Bannière -- dégradé de marque (voir index.css --civitas-purple /
          --civitas-navy), avatar en initiales, statuts. Retour et
          édition en boutons "glass" flottants pour rester lisibles
          quel que soit le contenu du dégradé en dessous. Prénom/Nom et
          les 3 pastilles de statut deviennent directement modifiables
          en mode édition -- voir RolePillEditor/TogglePill plus haut. */}
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
          {canManage && !isEdit && (
            <Button variant="glass" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={startEdit}>
              Modifier
            </Button>
          )}
        </div>

        <div className="relative flex flex-col items-center text-center mt-2">
          <InitialsAvatar initials={getInitials(name)} sizePx={88} className="border-4 border-white/30 shadow-lg text-2xl" />

          {isEdit ? (
            <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
              <input
                value={liveFirstName ?? ''}
                disabled={isSubmitting}
                placeholder="Prénom"
                onChange={(e) => setFieldValue('firstName', e.target.value)}
                className="w-32 sm:w-40 bg-transparent text-center text-xl font-bold text-white placeholder:text-white/40 border-b border-white/30 focus:border-white outline-none pb-1 transition-colors disabled:opacity-60"
              />
              <input
                value={liveLastName ?? ''}
                disabled={isSubmitting}
                placeholder="Nom"
                onChange={(e) => setFieldValue('lastName', e.target.value)}
                className="w-32 sm:w-40 bg-transparent text-center text-xl font-bold text-white placeholder:text-white/40 border-b border-white/30 focus:border-white outline-none pb-1 transition-colors disabled:opacity-60"
              />
            </div>
          ) : (
            <h1 className="mt-4 text-2xl font-bold text-white font-display truncate max-w-full">{name}</h1>
          )}
          <p className="text-sm text-white/70 mt-1">@{record.username}</p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {isEdit && roleField ? (
              <RolePillEditor
                options={roleField.options ?? []}
                value={currentRole}
                dotClassName={roleDot}
                disabled={isSubmitting}
                onChange={(v) => setFieldValue('role', v)}
              />
            ) : (
              <StatusPill dotClassName={roleDot}>{roleLabel}</StatusPill>
            )}

            {isEdit ? (
              <TogglePill
                active={currentIsActive}
                dotOn="bg-emerald-400"
                dotOff="bg-gray-300"
                labelOn="Actif"
                labelOff="Inactif"
                disabled={isSubmitting}
                onToggle={() => setFieldValue('isActive', !currentIsActive)}
              />
            ) : (
              <StatusPill dotClassName={currentIsActive ? 'bg-emerald-400' : 'bg-gray-300'}>
                {currentIsActive ? 'Actif' : 'Inactif'}
              </StatusPill>
            )}

            {isEdit ? (
              <TogglePill
                active={currentIsVerified}
                dotOn="bg-sky-400"
                dotOff="bg-gray-300"
                labelOn="Vérifié"
                labelOff="Non vérifié"
                disabled={isSubmitting}
                onToggle={() => setFieldValue('isVerified', !currentIsVerified)}
              />
            ) : (
              <StatusPill dotClassName={currentIsVerified ? 'bg-sky-400' : 'bg-gray-300'}>
                {currentIsVerified ? 'Vérifié' : 'Non vérifié'}
              </StatusPill>
            )}
          </div>
        </div>
      </div>

      {formError && (
        <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-sm text-red-600 dark:text-red-400">
          {formError}
        </div>
      )}

      {/* Grille d'informations -- une tuile par champ. Email/Téléphone/
          Adresse/Date de naissance/Établissement/Organisation
          deviennent modifiables en édition (EditableInfoTile) ; Membre
          depuis/Dernière connexion/Langue restent purement
          consultatives (aucun champ correspondant dans le registre) ;
          Mot de passe reste toujours statique et grisée. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <EditableInfoTile icon={Mail} label="Email" mode={mode} viewValue={record.email || 'Non renseigné'}>
          <input
            type="email"
            value={(values.email as string) ?? ''}
            disabled={isSubmitting}
            placeholder="Non renseigné"
            onChange={(e) => setFieldValue('email', e.target.value)}
            className={editInputClass}
          />
        </EditableInfoTile>

        <PasswordInfoTile />

        <EditableInfoTile icon={Phone} label="Téléphone" mode={mode} viewValue={record.phoneNumber || 'Non renseigné'}>
          <input
            type="tel"
            value={(values.phoneNumber as string) ?? ''}
            disabled={isSubmitting}
            placeholder="Non renseigné"
            onChange={(e) => setFieldValue('phoneNumber', e.target.value)}
            className={editInputClass}
          />
        </EditableInfoTile>

        <EditableInfoTile icon={MapPin} label="Adresse" mode={mode} viewValue={record.address || 'Non renseignée'}>
          <input
            type="text"
            value={(values.address as string) ?? ''}
            disabled={isSubmitting}
            placeholder="Non renseignée"
            onChange={(e) => setFieldValue('address', e.target.value)}
            className={editInputClass}
          />
        </EditableInfoTile>

        <EditableInfoTile
          icon={Cake}
          label="Date de naissance"
          mode={mode}
          viewValue={record.dateOfBirth ? formatDateOnly(record.dateOfBirth) : null}
        >
          <input
            type="date"
            value={(values.dateOfBirth as string) ?? ''}
            disabled={isSubmitting}
            onChange={(e) => setFieldValue('dateOfBirth', e.target.value)}
            className={editInputClass}
          />
        </EditableInfoTile>

        <InfoTile icon={CalendarDays} label="Membre depuis" value={record.dateJoined ? formatDateFull(record.dateJoined) : null} />
        <InfoTile icon={Clock} label="Dernière connexion" value={record.lastLogin ? formatDateRelative(record.lastLogin) : 'Jamais connecté'} />

        <EditableInfoTile icon={Building2} label="Établissement" mode={mode} viewValue={etablissementNom}>
          {etablissementField && (
            <FkSelectField
              compact
              label={etablissementField.label}
              fkTarget={etablissementField.fkTarget!}
              labelField={etablissementField.fkLabelField}
              value={values.etablissement as string | undefined}
              nullable
              disabled={isSubmitting}
              onChange={(id) => setFieldValue('etablissement', id)}
            />
          )}
        </EditableInfoTile>

        <EditableInfoTile icon={Landmark} label="Organisation" mode={mode} viewValue={organisationNom}>
          {organisationField && (
            <FkSelectField
              compact
              label={organisationField.label}
              fkTarget={organisationField.fkTarget!}
              labelField={organisationField.fkLabelField}
              value={values.organisation as string | undefined}
              nullable
              disabled={isSubmitting}
              onChange={(id) => setFieldValue('organisation', id)}
            />
          )}
        </EditableInfoTile>

        <InfoTile
          icon={Globe}
          label="Langue & fuseau horaire"
          value={[record.languagePreference, record.timezone].filter(Boolean).join(' · ') || null}
        />
      </div>

      {/* Badges -- uniquement si l'utilisateur en possède au moins un.
          Purement consultatif (readOnly + hiddenInForm dans le
          registre) : inchangé, désormais aussi visible en édition. */}
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

      {!isEdit && record.isVerified === false && (
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 px-1">
          <BadgeX className="w-3.5 h-3.5" />
          Compte non vérifié -- certaines actions peuvent être limitées côté produit.
        </div>
      )}
      {!isEdit && record.isVerified && (
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 px-1">
          <BadgeCheck className="w-3.5 h-3.5 text-sky-500" />
          Identité vérifiée.
        </div>
      )}

      {/* Barre d'actions -- uniquement en édition, même emplacement/
          mêmes libellés que le bas de BackofficeRecordForm ailleurs
          dans le backoffice (cohérence de l'app). */}
      {isEdit && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <Button type="button" variant="ghost" onClick={cancelEdit} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            isLoading={isSubmitting}
            icon={<Save className="w-4 h-4" />}
            onClick={handleSave}
          >
            Enregistrer
          </Button>
        </div>
      )}
    </div>
  );
}
