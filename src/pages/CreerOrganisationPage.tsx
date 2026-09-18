// ============================================================
// src/pages/CreerOrganisationPage.tsx
// Création self-service d'une organisation (= un tenant, architecture
// tenant-autonome -- voir Tenant.create_with_domain côté backend).
//
// Identité visuelle dédiée "formulaire d'enregistrement" -- bandeau
// d'en-tête (marque + titre), sections à bandeau plein-largeur,
// lignes de champ libellé + soulignement, pied de page -- entièrement
// distincte du reste de l'app (voir RegistrationFormKit.tsx). Toute la
// logique (état, validation, soumission) reste dans
// useCreerOrganisationForm, INCHANGÉE : cette page n'en modifie que la
// présentation. Les 7 étapes de l'assistant d'origine sont désormais
// autant de SECTIONS empilées sur une seule page scrollable -- plus
// besoin d'un stepper puisque tous les champs sont visibles à la fois ;
// `stepIndex` (toujours mis à jour par le hook en cas d'échec de
// validation à la soumission) sert uniquement à faire défiler jusqu'à
// la première section en erreur, voir l'effet plus bas.
//
// Page affichée SANS le chrome habituel de l'app (topbar/dock/colonne
// latérale/fond de page animé par défaut) -- voir la route dédiée hors
// <MainLayout> dans App.tsx, qui est justement ce qui monte ce chrome.
// Cette page peint elle-même son propre fond plein-viewport (voir le
// conteneur racine ci-dessous) : uniquement le formulaire, comme un
// document autonome.
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ExternalLink, ImagePlus, Loader2, Plus, Repeat2, Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { SelectComboboxField } from '../components/backoffice/fields/SelectComboboxField';
import {
  FORME_JURIDIQUE_OPTIONS,
  SECTEUR_ACTIVITE_OPTIONS,
  PROVINCE_GABON_OPTIONS,
  RESEAU_SOCIAL_OPTIONS,
} from '../features/organisations/creation/informationsPrimaires.options';
import {
  useCreerOrganisationForm,
  CREATION_STEPS,
  type CreationStep,
} from '../features/organisations/creation/useCreerOrganisationForm';
import {
  DiamondMark,
  SectionBar,
  SectionBody,
  SubHeading,
  Field,
  FieldPair,
  UnderlineInput,
  UnderlineTextarea,
  UnderlinePasswordInput,
  RadioGroup,
  LABEL_PAD,
} from '../features/organisations/creation/components/RegistrationFormKit';

/** Petit indicateur de disponibilité du sous-domaine -- glissé en suffixe de son UnderlineInput. */
function SousDomaineIndicateur({ status }: { status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error' }) {
  if (status === 'checking') return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
  if (status === 'available') return <Check className="h-4 w-4 text-green-600" />;
  if (status === 'taken' || status === 'invalid') return <X className="h-4 w-4 text-red-500" />;
  return null;
}

/** Sélection + prévisualisation du logo -- même mécanique que sur l'ancienne version de cette page, recolorée/resserrée pour s'aligner sur les lignes soulignées voisines. */
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
    <div className="flex items-center gap-3 pb-1">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handlePick} />
      {file && previewUrl ? (
        <img src={previewUrl} alt="Aperçu du logo" className="h-12 w-12 rounded-sm border border-[#B7B7B7] object-cover" />
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-12 w-12 items-center justify-center rounded-sm border border-dashed border-[#B7B7B7] text-gray-400 transition-colors hover:border-[#01526B] hover:text-[#01526B]"
        >
          <ImagePlus className="h-4 w-4" />
        </button>
      )}
      {file && (
        <div className="flex flex-col gap-1">
          <span className="max-w-[180px] truncate text-xs text-gray-500">{file.name}</span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#01526B] hover:underline"
            >
              <Repeat2 className="h-3.5 w-3.5" /> Remplacer
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:underline"
            >
              <X className="h-3.5 w-3.5" /> Retirer
            </button>
          </div>
        </div>
      )}
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
    submit,
  } = useCreerOrganisationForm();

  const [passwordConfirmTouched, setPasswordConfirmTouched] = useState(false);

  const today = useMemo(
    () => new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date()),
    [],
  );

  // Défilement automatique vers la première section en erreur : `submit`
  // (voir useCreerOrganisationForm) positionne déjà `stepIndex` sur la
  // première étape invalide -- ici on traduit uniquement ce changement
  // en scroll, plus besoin de masquer/afficher des étapes puisque
  // TOUTES les sections sont désormais toujours visibles.
  const sectionRefs = useRef<Partial<Record<CreationStep, HTMLElement | null>>>({});
  const prevStepIndexRef = useRef(stepIndex);
  useEffect(() => {
    if (stepIndex !== prevStepIndexRef.current) {
      sectionRefs.current[CREATION_STEPS[stepIndex]]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    prevStepIndexRef.current = stepIndex;
  }, [stepIndex]);
  const setSectionRef = (step: CreationStep) => (el: HTMLElement | null) => {
    sectionRefs.current[step] = el;
  };

  if (result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EEF1F2] px-4 py-10">
        <div className="w-full max-w-md border-[8px] border-[#01526B] bg-white p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-600">
            <Check className="h-7 w-7" />
          </div>
          <h1 className="font-display text-xl font-extrabold text-[#262626]">{result.name} est prête</h1>
          <p className="mt-3 text-sm text-gray-500">
            Le compte administrateur (<span className="font-medium text-[#262626]">{result.identifiant}</span>) est
            déjà actif dans cette organisation, avec le mot de passe que vous venez de choisir.
          </p>
          {!result.ficheEnregistree && (
            <p className="mt-3 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              La fiche d'identité n'a pas pu être enregistrée automatiquement -- vous pourrez la compléter depuis
              votre espace administrateur.
            </p>
          )}
          <a
            href={`https://${result.domaine}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#01526B] hover:underline"
          >
            {result.domaine}
            <ExternalLink className="h-4 w-4" />
          </a>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center bg-[#01526B] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#01394A]"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF1F2] px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[900px] border-[8px] border-[#01526B] bg-white sm:border-[12px]">
        {/* En-tête : marque à gauche, titre du formulaire sur bandeau teal à droite. */}
        <div className="flex flex-col sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-3 px-5 py-6 sm:px-10 sm:py-8">
            <div className="flex items-center gap-4">
              <DiamondMark />
              <span className="font-display text-lg font-extrabold uppercase tracking-tight text-[#01526B] sm:text-2xl">
                Civitas News
              </span>
            </div>
            <span className="inline-flex w-fit items-center border-[1.5px] border-[#01526B] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#01526B] sm:text-[11px]">
              Nouvelle organisation
            </span>
          </div>
          <div className="hidden w-[6px] shrink-0 bg-[#00C2F5] sm:block" aria-hidden="true" />
          <div className="flex flex-1 items-center justify-end bg-[#01526B] px-5 py-6 sm:px-10 sm:py-8">
            <h1 className="max-w-[300px] text-right text-2xl font-extrabold uppercase leading-[1.15] tracking-tight text-white sm:max-w-[360px] sm:text-4xl">
              Création d'organisation
            </h1>
          </div>
        </div>

        {/* Ligne méta : rappel des champs obligatoires + date du jour, comme sur un formulaire papier daté. */}
        <div className="flex flex-col gap-2 border-b border-[#E3E3E3] px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-10">
          <p className="text-[11px] text-gray-400">
            Les champs marqués d'un <span className="font-semibold text-red-500">*</span> sont obligatoires.
          </p>
          <span className="text-[11px] text-gray-500 sm:text-xs">Date : {today}</span>
        </div>

        {/* ------------------------------------------------ */}
        {/* Section 1 -- Organisation                          */}
        {/* ------------------------------------------------ */}
        <section ref={setSectionRef('infos')}>
          <SectionBar>Organisation</SectionBar>
          <SectionBody>
            <Field label="Nom de l'organisation" required htmlFor="org-name" error={errors.name}>
              <UnderlineInput
                id="org-name"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                autoFocus
                hasError={Boolean(errors.name)}
              />
            </Field>

            <div>
              <Field label="Sous-domaine" required htmlFor="org-sousdomaine" error={errors.sousDomaine}>
                <UnderlineInput
                  id="org-sousdomaine"
                  value={form.sousDomaine}
                  onChange={(e) => setSousDomaine(e.target.value.toLowerCase())}
                  placeholder="mon-organisation"
                  hasError={Boolean(errors.sousDomaine)}
                  suffix={<SousDomaineIndicateur status={sousDomaineStatus} />}
                />
              </Field>
              {!errors.sousDomaine && sousDomaineStatus === 'available' && (
                <p className={cn(LABEL_PAD, '-mt-4 text-[11px] font-medium text-green-600')}>
                  Ce sous-domaine est disponible.
                </p>
              )}
            </div>

            <Field label="Description courte (optionnelle)" htmlFor="org-description">
              <UnderlineInput
                id="org-description"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
              />
            </Field>

            <Field label="Logo (optionnel)">
              <LogoField
                file={form.logo}
                onFileSelected={(f) => setField('logo', f)}
                onRemove={() => setField('logo', null)}
              />
            </Field>
          </SectionBody>
        </section>

        {/* ------------------------------------------------ */}
        {/* Section 2 -- Identité légale                       */}
        {/* ------------------------------------------------ */}
        <section ref={setSectionRef('identite')}>
          <SectionBar>Identité légale</SectionBar>
          <SectionBody note="Fiche d'identité légale de l'organisation -- utile à la plateforme et modifiable ensuite depuis votre espace administrateur.">
            <Field label="Forme juridique" required htmlFor="org-forme-juridique" error={errors.formeJuridique}>
              <SelectComboboxField
                id="org-forme-juridique"
                label="Forme juridique"
                hideLabel
                variant="underline"
                options={FORME_JURIDIQUE_OPTIONS}
                value={form.formeJuridique || undefined}
                onChange={(v) => setField('formeJuridique', v ?? '')}
                required
                error={errors.formeJuridique}
              />
            </Field>

            <Field label="Secteur d'activité" required htmlFor="org-secteur-activite" error={errors.secteurActivite}>
              <SelectComboboxField
                id="org-secteur-activite"
                label="Secteur d'activité"
                hideLabel
                variant="underline"
                options={SECTEUR_ACTIVITE_OPTIONS}
                value={form.secteurActivite || undefined}
                onChange={(v) => setField('secteurActivite', v ?? '')}
                required
                error={errors.secteurActivite}
              />
            </Field>

            <Field label="Raison sociale / dénomination" required htmlFor="org-raison" error={errors.raisonSociale}>
              <UnderlineInput
                id="org-raison"
                value={form.raisonSociale}
                onChange={(e) => setField('raisonSociale', e.target.value)}
                hasError={Boolean(errors.raisonSociale)}
              />
            </Field>

            <Field label="Sigle / Acronyme (optionnel)" htmlFor="org-sigle">
              <UnderlineInput id="org-sigle" value={form.sigle} onChange={(e) => setField('sigle', e.target.value)} />
            </Field>

            <FieldPair>
              <Field label="Numéro RCCM" required htmlFor="org-rccm" error={errors.numeroRccm}>
                <UnderlineInput
                  id="org-rccm"
                  value={form.numeroRccm}
                  onChange={(e) => setField('numeroRccm', e.target.value)}
                  hasError={Boolean(errors.numeroRccm)}
                />
              </Field>
              <Field label="Numéro NIF" required htmlFor="org-nif" error={errors.numeroNif}>
                <UnderlineInput
                  id="org-nif"
                  value={form.numeroNif}
                  onChange={(e) => setField('numeroNif', e.target.value)}
                  hasError={Boolean(errors.numeroNif)}
                />
              </Field>
            </FieldPair>

            <Field label="N° d'agrément (optionnel)" htmlFor="org-agrement">
              <UnderlineInput
                id="org-agrement"
                value={form.numeroAgrement}
                onChange={(e) => setField('numeroAgrement', e.target.value)}
              />
            </Field>

            <Field
              label="Date de création / d'agrément"
              required
              htmlFor="org-date-creation"
              error={errors.dateCreationOuAgrement}
            >
              <UnderlineInput
                id="org-date-creation"
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={form.dateCreationOuAgrement}
                onChange={(e) => setField('dateCreationOuAgrement', e.target.value)}
                hasError={Boolean(errors.dateCreationOuAgrement)}
              />
            </Field>
          </SectionBody>
        </section>

        {/* ------------------------------------------------ */}
        {/* Section 3 -- Coordonnées                           */}
        {/* ------------------------------------------------ */}
        <section ref={setSectionRef('coordonnees')}>
          <SectionBar>Coordonnées</SectionBar>
          <SectionBody>
            <Field label="Adresse du siège" required align="start" htmlFor="org-adresse" error={errors.adresseSiege}>
              <UnderlineTextarea
                id="org-adresse"
                rows={2}
                value={form.adresseSiege}
                onChange={(e) => setField('adresseSiege', e.target.value)}
                hasError={Boolean(errors.adresseSiege)}
              />
            </Field>

            <FieldPair>
              <Field label="Ville" required htmlFor="org-ville" error={errors.ville}>
                <UnderlineInput
                  id="org-ville"
                  value={form.ville}
                  onChange={(e) => setField('ville', e.target.value)}
                  hasError={Boolean(errors.ville)}
                />
              </Field>
              <Field label="Province" required htmlFor="org-province" error={errors.province}>
                <SelectComboboxField
                  id="org-province"
                  label="Province"
                  hideLabel
                  variant="underline"
                  options={PROVINCE_GABON_OPTIONS}
                  value={form.province || undefined}
                  onChange={(v) => setField('province', v ?? '')}
                  required
                  error={errors.province}
                />
              </Field>
            </FieldPair>

            <Field label="Pays" htmlFor="org-pays">
              <UnderlineInput id="org-pays" value={form.pays} onChange={(e) => setField('pays', e.target.value)} />
            </Field>

            <FieldPair>
              <Field label="Téléphone principal" required htmlFor="org-tel1" error={errors.telephonePrincipal}>
                <UnderlineInput
                  id="org-tel1"
                  type="tel"
                  placeholder="+241 XX XX XX XX"
                  value={form.telephonePrincipal}
                  onChange={(e) => setField('telephonePrincipal', e.target.value)}
                  hasError={Boolean(errors.telephonePrincipal)}
                />
              </Field>
              <Field label="Téléphone secondaire" htmlFor="org-tel2">
                <UnderlineInput
                  id="org-tel2"
                  type="tel"
                  placeholder="+241 XX XX XX XX"
                  value={form.telephoneSecondaire}
                  onChange={(e) => setField('telephoneSecondaire', e.target.value)}
                />
              </Field>
            </FieldPair>

            <Field label="Email de contact" required htmlFor="org-email" error={errors.emailContact}>
              <UnderlineInput
                id="org-email"
                type="email"
                value={form.emailContact}
                onChange={(e) => setField('emailContact', e.target.value)}
                hasError={Boolean(errors.emailContact)}
              />
            </Field>

            <Field label="Site web (optionnel)" htmlFor="org-siteweb">
              <UnderlineInput
                id="org-siteweb"
                type="url"
                placeholder="https://..."
                value={form.siteWeb}
                onChange={(e) => setField('siteWeb', e.target.value)}
              />
            </Field>

            <Field label="Réseaux sociaux (optionnel)" align="start">
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={addReseauSocial}
                  className="inline-flex w-fit items-center gap-1 text-[12.5px] font-semibold text-[#01526B] hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Ajouter un réseau
                </button>
                {form.reseauxSociaux.map((entry) => (
                  <div key={entry.id} className="flex items-end gap-3">
                    <div className="w-[118px] shrink-0 sm:w-[150px]">
                      <SelectComboboxField
                        label="Plateforme"
                        hideLabel
                        variant="underline"
                        placeholder="Plateforme"
                        options={RESEAU_SOCIAL_OPTIONS}
                        value={entry.plateforme || undefined}
                        onChange={(v) => updateReseauSocial(entry.id, { plateforme: v ?? '' })}
                      />
                    </div>
                    <UnderlineInput
                      placeholder="https://..."
                      value={entry.url}
                      onChange={(e) => updateReseauSocial(entry.id, { url: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => removeReseauSocial(entry.id)}
                      aria-label="Retirer ce réseau social"
                      className="shrink-0 pb-[7px] text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </Field>
          </SectionBody>
        </section>

        {/* ------------------------------------------------ */}
        {/* Section 4 -- Responsable & contact                 */}
        {/* ------------------------------------------------ */}
        <section ref={setSectionRef('responsable')}>
          <SectionBar>Responsable &amp; contact</SectionBar>
          <SectionBody>
            <SubHeading>Responsable légal</SubHeading>
            <Field label="Nom complet" required htmlFor="resp-nom" error={errors.responsableNomComplet}>
              <UnderlineInput
                id="resp-nom"
                value={form.responsableNomComplet}
                onChange={(e) => setField('responsableNomComplet', e.target.value)}
                hasError={Boolean(errors.responsableNomComplet)}
              />
            </Field>
            <Field label="Fonction" required htmlFor="resp-fonction" error={errors.responsableFonction}>
              <UnderlineInput
                id="resp-fonction"
                value={form.responsableFonction}
                onChange={(e) => setField('responsableFonction', e.target.value)}
                hasError={Boolean(errors.responsableFonction)}
              />
            </Field>
            <FieldPair>
              <Field label="Téléphone" required htmlFor="resp-tel" error={errors.responsableTelephone}>
                <UnderlineInput
                  id="resp-tel"
                  type="tel"
                  value={form.responsableTelephone}
                  onChange={(e) => setField('responsableTelephone', e.target.value)}
                  hasError={Boolean(errors.responsableTelephone)}
                />
              </Field>
              <Field label="Email" required htmlFor="resp-email" error={errors.responsableEmail}>
                <UnderlineInput
                  id="resp-email"
                  type="email"
                  value={form.responsableEmail}
                  onChange={(e) => setField('responsableEmail', e.target.value)}
                  hasError={Boolean(errors.responsableEmail)}
                />
              </Field>
            </FieldPair>

            <SubHeading>Contact opérationnel</SubHeading>
            <Field label="Contact opérationnel">
              <RadioGroup
                name="contact-operationnel-identique"
                value={form.contactOperationnelIdentique ? 'identique' : 'different'}
                onChange={(v) => setField('contactOperationnelIdentique', v === 'identique')}
                options={[
                  { value: 'identique', label: 'Identique au responsable légal' },
                  { value: 'different', label: 'Contact différent' },
                ]}
              />
            </Field>

            {!form.contactOperationnelIdentique && (
              <>
                <Field label="Nom complet (optionnel)" htmlFor="contact-nom">
                  <UnderlineInput
                    id="contact-nom"
                    value={form.contactOperationnelNom}
                    onChange={(e) => setField('contactOperationnelNom', e.target.value)}
                  />
                </Field>
                <Field label="Fonction (optionnelle)" htmlFor="contact-fonction">
                  <UnderlineInput
                    id="contact-fonction"
                    value={form.contactOperationnelFonction}
                    onChange={(e) => setField('contactOperationnelFonction', e.target.value)}
                  />
                </Field>
                <FieldPair>
                  <Field label="Téléphone (optionnel)" htmlFor="contact-tel">
                    <UnderlineInput
                      id="contact-tel"
                      type="tel"
                      value={form.contactOperationnelTelephone}
                      onChange={(e) => setField('contactOperationnelTelephone', e.target.value)}
                    />
                  </Field>
                  <Field label="Email (optionnel)" htmlFor="contact-email" error={errors.contactOperationnelEmail}>
                    <UnderlineInput
                      id="contact-email"
                      type="email"
                      value={form.contactOperationnelEmail}
                      onChange={(e) => setField('contactOperationnelEmail', e.target.value)}
                      hasError={Boolean(errors.contactOperationnelEmail)}
                    />
                  </Field>
                </FieldPair>
              </>
            )}
          </SectionBody>
        </section>

        {/* ------------------------------------------------ */}
        {/* Section 5 -- Activités                             */}
        {/* ------------------------------------------------ */}
        <section ref={setSectionRef('activites')}>
          <SectionBar>Activités</SectionBar>
          <SectionBody>
            <Field label="Effectif estimé" required htmlFor="act-effectif" error={errors.effectifEstime}>
              <UnderlineInput
                id="act-effectif"
                type="number"
                min={0}
                placeholder="Nombre de membres / employés / adhérents"
                value={form.effectifEstime}
                onChange={(e) => setField('effectifEstime', e.target.value)}
                hasError={Boolean(errors.effectifEstime)}
              />
            </Field>
            <Field label="Zone de couverture (optionnelle)" align="start" htmlFor="act-zone">
              <UnderlineTextarea
                id="act-zone"
                rows={2}
                placeholder="Provinces / villes couvertes par l'activité"
                value={form.zoneCouverture}
                onChange={(e) => setField('zoneCouverture', e.target.value)}
              />
            </Field>
            <Field
              label="Description détaillée des activités"
              required
              align="start"
              htmlFor="act-description"
              error={errors.descriptionActivites}
            >
              <UnderlineTextarea
                id="act-description"
                rows={4}
                value={form.descriptionActivites}
                onChange={(e) => setField('descriptionActivites', e.target.value)}
                hasError={Boolean(errors.descriptionActivites)}
              />
            </Field>
          </SectionBody>
        </section>

        {/* ------------------------------------------------ */}
        {/* Section 6 -- Compte administrateur                 */}
        {/* ------------------------------------------------ */}
        <section ref={setSectionRef('admin')}>
          <SectionBar>Compte administrateur</SectionBar>
          <SectionBody
            note={
              <>
                Ce compte sera le premier administrateur de{' '}
                <span className="font-medium text-[#262626]">{form.name || 'cette organisation'}</span>, actif
                uniquement ici -- il n'aura aucun rôle ailleurs sur la plateforme.
              </>
            }
          >
            <Field label="Email ou téléphone" required htmlFor="admin-identifiant" error={errors.identifiant}>
              <UnderlineInput
                id="admin-identifiant"
                value={form.identifiant}
                onChange={(e) => setField('identifiant', e.target.value)}
                hasError={Boolean(errors.identifiant)}
              />
            </Field>
            <Field label="Mot de passe" required htmlFor="admin-password" error={errors.password}>
              <UnderlinePasswordInput
                id="admin-password"
                value={form.password}
                onChange={(v) => setField('password', v)}
                autoComplete="new-password"
                hasError={Boolean(errors.password)}
              />
            </Field>
            <Field
              label="Confirmer le mot de passe"
              required
              htmlFor="admin-password-confirm"
              error={passwordConfirmTouched ? errors.passwordConfirm : undefined}
            >
              <UnderlinePasswordInput
                id="admin-password-confirm"
                value={form.passwordConfirm}
                onChange={(v) => {
                  setPasswordConfirmTouched(true);
                  setField('passwordConfirm', v);
                }}
                autoComplete="new-password"
                hasError={passwordConfirmTouched && Boolean(errors.passwordConfirm)}
              />
            </Field>
          </SectionBody>
        </section>

        {/* Pied de page -- écho du bandeau contact/signature du gabarit,
            adapté à un formulaire numérique : marque, rappel d'éditabilité,
            puis l'action de soumission à la place de la ligne de signature. */}
        <div className="grid grid-cols-1 gap-6 border-t-2 border-[#01526B] px-5 py-7 sm:grid-cols-[1fr_1.4fr_auto] sm:gap-8 sm:px-10">
          <div className="flex items-center gap-3">
            <DiamondMark scale={0.68} />
            <div className="text-[12px] leading-snug text-gray-500">
              <p className="font-semibold text-[#01526B]">Civitas News</p>
              <p>Espace organisations</p>
            </div>
          </div>
          <div className="border-t border-[#E3E3E3] pt-4 text-[12px] leading-snug text-gray-500 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
            Votre fiche reste modifiable depuis l'espace administrateur après la création de l'organisation.
          </div>
          <div className="flex items-center border-t border-[#E3E3E3] pt-4 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
            <button
              type="button"
              onClick={submit}
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 bg-[#01526B] px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#01394A] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Créer l'organisation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
