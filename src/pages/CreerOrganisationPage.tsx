// ============================================================
// src/pages/CreerOrganisationPage.tsx
// Création self-service d'une organisation (= un tenant, architecture
// tenant-autonome -- voir Tenant.create_with_domain côté backend).
// 7 étapes -- voir le docstring de useCreerOrganisationForm pour le
// détail de chacune. Tous les champs texte/date réutilisent les MÊMES
// composants que le reste de l'app (Input, DatePicker), les sélections
// utilisent le combobox recherchable partagé avec le backoffice
// (SelectComboboxField, indicateur `*` déjà intégré) -- aucun champ
// "maison" ponctuel.
// ============================================================
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Check,
  ExternalLink,
  ImagePlus,
  Loader2,
  Plus,
  Repeat2,
  Trash2,
  X,
} from 'lucide-react';
import { Stepper, type Step } from '../components/ui/Stepper';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import PasswordField from '../components/auth/PasswordField';
import { SelectComboboxField } from '../components/backoffice/fields/SelectComboboxField';
import {
  FORME_JURIDIQUE_OPTIONS,
  SECTEUR_ACTIVITE_OPTIONS,
  PROVINCE_GABON_OPTIONS,
  RESEAU_SOCIAL_OPTIONS,
  libelleOption,
} from '../features/organisations/creation/informationsPrimaires.options';
import { useCreerOrganisationForm } from '../features/organisations/creation/useCreerOrganisationForm';

const STEPPER_STEPS: Step[] = [
  { id: 'infos', title: 'Organisation', description: 'Nom, sous-domaine, logo' },
  { id: 'identite', title: 'Identité légale', description: 'Forme, secteur, immatriculation' },
  { id: 'coordonnees', title: 'Coordonnées', description: 'Adresse et contacts' },
  { id: 'responsable', title: 'Responsable', description: 'Responsable légal' },
  { id: 'activites', title: 'Activités', description: 'Effectif et description' },
  { id: 'admin', title: 'Administrateur', description: 'Le compte qui la gèrera' },
  { id: 'verification', title: 'Vérification', description: 'Relire et créer' },
];

const inputClass =
  'w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#242A5C] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4DFF] transition-all disabled:opacity-60 disabled:cursor-not-allowed resize-y';
const labelClass = 'text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5';

/** Reprend le procédé déjà utilisé par DatePicker/BackofficeRecordForm pour marquer un champ obligatoire : `label *`. */
function req(label: string, isRequired = true) {
  return isRequired ? `${label} *` : label;
}

function SousDomaineIndicateur({ status }: { status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error' }) {
  if (status === 'checking') return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;
  if (status === 'available') return <Check className="w-4 h-4 text-green-500" />;
  if (status === 'taken' || status === 'invalid') return <X className="w-4 h-4 text-red-500" />;
  return null;
}

function ErrorText({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="-mt-2 text-xs font-medium text-red-500">{children}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#5B4DFF] pt-1 first:pt-0">{children}</h2>
  );
}

/** Sélection + prévisualisation du logo -- même mécanique que CoverImageField (news), en rond/carré pour un logo d'organisation. */
function LogoField({
  file,
  onFileSelected,
  onRemove,
}: {
  file: File | null;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) {
      onFileSelected(picked);
      setPreviewUrl(URL.createObjectURL(picked));
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelClass}>Logo (optionnel)</label>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handlePick} />
      <div className="flex items-center gap-3">
        {file && previewUrl ? (
          <img src={previewUrl} alt="Aperçu du logo" className="w-16 h-16 rounded-2xl object-cover border border-gray-200 dark:border-gray-700" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-16 h-16 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-400 hover:text-[#5B4DFF] hover:border-[#5B4DFF]/50 flex items-center justify-center transition-colors"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
        )}
        {file && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">{file.name}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B4DFF] hover:underline"
              >
                <Repeat2 className="w-3.5 h-3.5" /> Remplacer
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:underline"
              >
                <X className="w-3.5 h-3.5" /> Retirer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreerOrganisationPage() {
  const navigate = useNavigate();
  const {
    stepIndex,
    form,
    setField,
    setSousDomaine,
    addReseauSocial,
    updateReseauSocial,
    removeReseauSocial,
    errors,
    sousDomaineStatus,
    isSubmitting,
    result,
    goNext,
    goBack,
    goToStep,
    submit,
  } = useCreerOrganisationForm();

  const [passwordConfirmTouched, setPasswordConfirmTouched] = useState(false);

  if (result) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10">
        <Card variant="glass" className="p-8 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center">
            <Check className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">{result.name} est prête</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Le compte administrateur (<span className="font-medium">{result.identifiant}</span>) est déjà actif dans
            cette organisation, avec le mot de passe que vous venez de choisir.
          </p>
          {!result.ficheEnregistree && (
            <p className="text-xs font-medium text-amber-500 bg-amber-500/10 rounded-xl px-3 py-2">
              La fiche d'identité n'a pas pu être enregistrée automatiquement -- vous pourrez la compléter depuis
              votre espace administrateur.
            </p>
          )}
          <a
            href={`https://${result.domaine}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#5B4DFF] hover:underline"
          >
            {result.domaine}
            <ExternalLink className="w-4 h-4" />
          </a>
          <div className="pt-2">
            <Button variant="primary" onClick={() => navigate('/')}>
              Retour à l'accueil
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const step = STEPPER_STEPS[stepIndex].id;

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-xl bg-[#5B4DFF]/10 dark:bg-[#5B4DFF]/20 text-[#5B4DFF]">
          <Building2 className="w-4 h-4" />
        </div>
        <h1 className="text-lg font-extrabold text-gray-900 dark:text-white font-display tracking-tight">
          Créer une organisation
        </h1>
      </div>

      <Stepper steps={STEPPER_STEPS} currentStepIndex={stepIndex} onStepClick={goToStep} />
      <p className="-mt-4 text-[11px] text-gray-400 dark:text-gray-500">
        Les champs marqués d'un <span className="text-red-500 font-semibold">*</span> sont obligatoires.
      </p>

      <Card variant="glass" className="p-6 space-y-4">
        {step === 'infos' && (
          <>
            <Input
              label={req("Nom de l'organisation")}
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              autoFocus
            />
            <ErrorText>{errors.name}</ErrorText>

            <div className="relative">
              <Input
                label={req('Sous-domaine')}
                value={form.sousDomaine}
                onChange={(e) => setSousDomaine(e.target.value.toLowerCase())}
                inputClassName="pr-8"
                placeholder="mon-organisation"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <SousDomaineIndicateur status={sousDomaineStatus} />
              </div>
            </div>
            {errors.sousDomaine ? (
              <ErrorText>{errors.sousDomaine}</ErrorText>
            ) : (
              sousDomaineStatus === 'available' && (
                <p className="-mt-2 text-xs font-medium text-green-500">Ce sous-domaine est disponible.</p>
              )
            )}

            <Input
              label="Description courte (optionnelle)"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />

            <LogoField file={form.logo} onFileSelected={(f) => setField('logo', f)} onRemove={() => setField('logo', null)} />
          </>
        )}

        {step === 'identite' && (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Fiche d'identité légale de l'organisation -- utile à la plateforme et modifiable ensuite depuis votre
              espace administrateur.
            </p>
            <SelectComboboxField
              label="Forme juridique"
              options={FORME_JURIDIQUE_OPTIONS}
              value={form.formeJuridique || undefined}
              onChange={(v) => setField('formeJuridique', v ?? '')}
              required
              error={errors.formeJuridique}
            />
            <SelectComboboxField
              label="Secteur d'activité"
              options={SECTEUR_ACTIVITE_OPTIONS}
              value={form.secteurActivite || undefined}
              onChange={(v) => setField('secteurActivite', v ?? '')}
              required
              error={errors.secteurActivite}
            />
            <Input
              label={req('Raison sociale / Dénomination officielle')}
              value={form.raisonSociale}
              onChange={(e) => setField('raisonSociale', e.target.value)}
            />
            <ErrorText>{errors.raisonSociale}</ErrorText>

            <Input
              label="Sigle / Acronyme (optionnel)"
              value={form.sigle}
              onChange={(e) => setField('sigle', e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  label={req('Numéro RCCM')}
                  value={form.numeroRccm}
                  onChange={(e) => setField('numeroRccm', e.target.value)}
                />
                <ErrorText>{errors.numeroRccm}</ErrorText>
              </div>
              <div>
                <Input
                  label={req('Numéro NIF')}
                  value={form.numeroNif}
                  onChange={(e) => setField('numeroNif', e.target.value)}
                />
                <ErrorText>{errors.numeroNif}</ErrorText>
              </div>
            </div>

            <Input
              label="Numéro d'agrément / de récépissé (optionnel)"
              value={form.numeroAgrement}
              onChange={(e) => setField('numeroAgrement', e.target.value)}
            />

            <Input
              label={req("Date de création / d'agrément")}
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={form.dateCreationOuAgrement}
              onChange={(e) => setField('dateCreationOuAgrement', e.target.value)}
            />
            <ErrorText>{errors.dateCreationOuAgrement}</ErrorText>
          </>
        )}

        {step === 'coordonnees' && (
          <>
            <div>
              <label className={labelClass}>{req('Adresse du siège')}</label>
              <textarea
                value={form.adresseSiege}
                onChange={(e) => setField('adresseSiege', e.target.value)}
                rows={2}
                className={`${inputClass} mt-1.5`}
              />
              <ErrorText>{errors.adresseSiege}</ErrorText>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input label={req('Ville')} value={form.ville} onChange={(e) => setField('ville', e.target.value)} />
                <ErrorText>{errors.ville}</ErrorText>
              </div>
              <SelectComboboxField
                label="Province"
                options={PROVINCE_GABON_OPTIONS}
                value={form.province || undefined}
                onChange={(v) => setField('province', v ?? '')}
                required
                error={errors.province}
              />
            </div>

            <Input label="Pays" value={form.pays} onChange={(e) => setField('pays', e.target.value)} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  label={req('Téléphone principal')}
                  type="tel"
                  placeholder="+241 XX XX XX XX"
                  value={form.telephonePrincipal}
                  onChange={(e) => setField('telephonePrincipal', e.target.value)}
                />
                <ErrorText>{errors.telephonePrincipal}</ErrorText>
              </div>
              <Input
                label="Téléphone secondaire"
                type="tel"
                placeholder="+241 XX XX XX XX"
                value={form.telephoneSecondaire}
                onChange={(e) => setField('telephoneSecondaire', e.target.value)}
              />
            </div>

            <div>
              <Input
                label={req('Email de contact')}
                type="email"
                value={form.emailContact}
                onChange={(e) => setField('emailContact', e.target.value)}
              />
              <ErrorText>{errors.emailContact}</ErrorText>
            </div>

            <Input
              label="Site web (optionnel)"
              type="url"
              placeholder="https://..."
              value={form.siteWeb}
              onChange={(e) => setField('siteWeb', e.target.value)}
            />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className={labelClass}>Réseaux sociaux (optionnel)</label>
                <button
                  type="button"
                  onClick={addReseauSocial}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#5B4DFF] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter
                </button>
              </div>
              {form.reseauxSociaux.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2">
                  <div className="w-36 shrink-0">
                    <SelectComboboxField
                      label=""
                      placeholder="Plateforme"
                      options={RESEAU_SOCIAL_OPTIONS}
                      value={entry.plateforme || undefined}
                      onChange={(v) => updateReseauSocial(entry.id, { plateforme: v ?? '' })}
                    />
                  </div>
                  <Input
                    label="URL"
                    placeholder="https://..."
                    value={entry.url}
                    onChange={(e) => updateReseauSocial(entry.id, { url: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeReseauSocial(entry.id)}
                    className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Retirer ce réseau social"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {step === 'responsable' && (
          <>
            <SectionTitle>Responsable légal</SectionTitle>
            <div>
              <Input
                label={req('Nom complet')}
                value={form.responsableNomComplet}
                onChange={(e) => setField('responsableNomComplet', e.target.value)}
                autoFocus
              />
              <ErrorText>{errors.responsableNomComplet}</ErrorText>
            </div>
            <div>
              <Input
                label={req('Fonction')}
                value={form.responsableFonction}
                onChange={(e) => setField('responsableFonction', e.target.value)}
              />
              <ErrorText>{errors.responsableFonction}</ErrorText>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  label={req('Téléphone')}
                  type="tel"
                  value={form.responsableTelephone}
                  onChange={(e) => setField('responsableTelephone', e.target.value)}
                />
                <ErrorText>{errors.responsableTelephone}</ErrorText>
              </div>
              <div>
                <Input
                  label={req('Email')}
                  type="email"
                  value={form.responsableEmail}
                  onChange={(e) => setField('responsableEmail', e.target.value)}
                />
                <ErrorText>{errors.responsableEmail}</ErrorText>
              </div>
            </div>

            <SectionTitle>Contact opérationnel</SectionTitle>
            <label className="flex items-center gap-3 py-1 cursor-pointer select-none">
              <button
                type="button"
                onClick={() => setField('contactOperationnelIdentique', !form.contactOperationnelIdentique)}
                className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${
                  form.contactOperationnelIdentique ? 'bg-[#5B4DFF]' : 'bg-gray-300 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    form.contactOperationnelIdentique ? 'translate-x-[18px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                C'est le même que le responsable légal
              </span>
            </label>

            {!form.contactOperationnelIdentique && (
              <>
                <Input
                  label="Nom complet (optionnel)"
                  value={form.contactOperationnelNom}
                  onChange={(e) => setField('contactOperationnelNom', e.target.value)}
                />
                <Input
                  label="Fonction (optionnelle)"
                  value={form.contactOperationnelFonction}
                  onChange={(e) => setField('contactOperationnelFonction', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Téléphone (optionnel)"
                    type="tel"
                    value={form.contactOperationnelTelephone}
                    onChange={(e) => setField('contactOperationnelTelephone', e.target.value)}
                  />
                  <div>
                    <Input
                      label="Email (optionnel)"
                      type="email"
                      value={form.contactOperationnelEmail}
                      onChange={(e) => setField('contactOperationnelEmail', e.target.value)}
                    />
                    <ErrorText>{errors.contactOperationnelEmail}</ErrorText>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {step === 'activites' && (
          <>
            <div>
              <Input
                label={req('Effectif estimé')}
                type="number"
                min={0}
                placeholder="Nombre de membres / employés / adhérents"
                value={form.effectifEstime}
                onChange={(e) => setField('effectifEstime', e.target.value)}
                autoFocus
              />
              <ErrorText>{errors.effectifEstime}</ErrorText>
            </div>

            <div>
              <label className={labelClass}>Zone de couverture (optionnelle)</label>
              <textarea
                value={form.zoneCouverture}
                onChange={(e) => setField('zoneCouverture', e.target.value)}
                placeholder="Provinces / villes couvertes par l'activité"
                rows={2}
                className={`${inputClass} mt-1.5`}
              />
            </div>

            <div>
              <label className={labelClass}>{req('Description détaillée des activités')}</label>
              <textarea
                value={form.descriptionActivites}
                onChange={(e) => setField('descriptionActivites', e.target.value)}
                rows={4}
                className={`${inputClass} mt-1.5`}
              />
              <ErrorText>{errors.descriptionActivites}</ErrorText>
            </div>
          </>
        )}

        {step === 'admin' && (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ce compte sera le premier administrateur de <span className="font-medium">{form.name || 'cette organisation'}</span>,
              actif uniquement ici -- il n'aura aucun rôle ailleurs sur la plateforme.
            </p>
            <Input
              label={req('Email ou téléphone')}
              value={form.identifiant}
              onChange={(e) => setField('identifiant', e.target.value)}
              autoFocus
            />
            <ErrorText>{errors.identifiant}</ErrorText>

            <PasswordField
              id="creer-org-password"
              label={req('Mot de passe')}
              value={form.password}
              onChange={(v) => setField('password', v)}
              autoComplete="new-password"
              error={errors.password}
            />
            <PasswordField
              id="creer-org-password-confirm"
              label={req('Confirmer le mot de passe')}
              value={form.passwordConfirm}
              onChange={(v) => {
                setPasswordConfirmTouched(true);
                setField('passwordConfirm', v);
              }}
              autoComplete="new-password"
              error={passwordConfirmTouched ? errors.passwordConfirm : undefined}
            />
          </>
        )}

        {step === 'verification' && (
          <div className="space-y-4 text-sm">
            <RecapSection title="Organisation">
              <RecapLigne label="Nom" value={form.name} />
              <RecapLigne label="Sous-domaine" value={form.sousDomaine} />
              {form.description && <RecapLigne label="Description" value={form.description} />}
              {form.logo && <RecapLigne label="Logo" value={form.logo.name} />}
            </RecapSection>

            <RecapSection title="Identité légale">
              <RecapLigne label="Forme juridique" value={libelleOption(FORME_JURIDIQUE_OPTIONS, form.formeJuridique)} />
              <RecapLigne label="Secteur d'activité" value={libelleOption(SECTEUR_ACTIVITE_OPTIONS, form.secteurActivite)} />
              <RecapLigne label="Raison sociale" value={form.raisonSociale} />
              {form.sigle && <RecapLigne label="Sigle" value={form.sigle} />}
              <RecapLigne label="RCCM" value={form.numeroRccm} />
              <RecapLigne label="NIF" value={form.numeroNif} />
              {form.numeroAgrement && <RecapLigne label="Agrément" value={form.numeroAgrement} />}
              <RecapLigne label="Date de création" value={form.dateCreationOuAgrement} />
            </RecapSection>

            <RecapSection title="Coordonnées">
              <RecapLigne label="Adresse" value={form.adresseSiege} />
              <RecapLigne label="Ville" value={`${form.ville}, ${libelleOption(PROVINCE_GABON_OPTIONS, form.province) ?? ''}`} />
              <RecapLigne label="Pays" value={form.pays} />
              <RecapLigne label="Téléphone" value={form.telephonePrincipal} />
              <RecapLigne label="Email" value={form.emailContact} />
              {form.siteWeb && <RecapLigne label="Site web" value={form.siteWeb} />}
              {form.reseauxSociaux.length > 0 && (
                <RecapLigne
                  label="Réseaux sociaux"
                  value={form.reseauxSociaux
                    .filter((e) => e.plateforme && e.url)
                    .map((e) => libelleOption(RESEAU_SOCIAL_OPTIONS, e.plateforme))
                    .join(', ')}
                />
              )}
            </RecapSection>

            <RecapSection title="Responsable & contact">
              <RecapLigne label="Responsable" value={`${form.responsableNomComplet} — ${form.responsableFonction}`} />
              <RecapLigne label="Contact resp." value={`${form.responsableTelephone} · ${form.responsableEmail}`} />
              {!form.contactOperationnelIdentique && form.contactOperationnelNom && (
                <RecapLigne label="Contact opérationnel" value={form.contactOperationnelNom} />
              )}
            </RecapSection>

            <RecapSection title="Activités">
              <RecapLigne label="Effectif estimé" value={form.effectifEstime} />
              {form.zoneCouverture && <RecapLigne label="Zone de couverture" value={form.zoneCouverture} />}
              <RecapLigne label="Description" value={form.descriptionActivites} />
            </RecapSection>

            <RecapSection title="Administrateur">
              <RecapLigne label="Identifiant" value={form.identifiant} />
            </RecapSection>
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={goBack} disabled={stepIndex === 0 || isSubmitting}>
          Précédent
        </Button>
        {stepIndex < STEPPER_STEPS.length - 1 ? (
          <Button variant="primary" onClick={goNext}>
            Suivant
          </Button>
        ) : (
          <Button variant="primary" onClick={submit} isLoading={isSubmitting}>
            Créer l'organisation
          </Button>
        )}
      </div>
    </div>
  );
}

function RecapSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#5B4DFF]">{title}</h3>
      <div className="space-y-2 border-b border-gray-100 dark:border-white/10 pb-3">{children}</div>
    </div>
  );
}

function RecapLigne({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white text-right">{value}</span>
    </div>
  );
}
