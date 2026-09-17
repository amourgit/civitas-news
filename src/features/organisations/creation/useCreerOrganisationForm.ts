// ============================================================
// src/features/organisations/creation/useCreerOrganisationForm.ts
// État + validation du formulaire multi-étapes de création d'une
// organisation (= un tenant, voir Tenant.create_with_domain côté
// backend). 7 étapes, exhaustives vis-à-vis des deux tables backend
// qui composent l'identité d'un tenant :
//   1. infos        -- Tenant (name, sous_domaine, description, logo)
//   2. identite      -- TenantInformationsPrimaires : identification légale
//   3. coordonnees   -- TenantInformationsPrimaires : coordonnées
//   4. responsable   -- TenantInformationsPrimaires : responsable légal + contact opérationnel
//   5. activites     -- TenantInformationsPrimaires : effectif/zone/activités
//   6. admin         -- premier administrateur (créé DANS le nouveau tenant, aucun rôle ailleurs)
//   7. verification  -- relire et créer
//
// Les champs marqués obligatoires côté UX reprennent exactement
// `TenantInformationsPrimaires.CHAMPS_COMPLETION` (backend) : le
// modèle lui-même les accepte `blank=True` (une fiche peut rester
// partielle et être complétée plus tard depuis l'espace admin), mais
// ce sont ceux que la plateforme compte dans son propre indicateur de
// complétion -- il est donc cohérent de les demander dès la création.
// ============================================================
import { useCallback, useRef, useState } from 'react';
import {
  tenantsRepository,
  TenantCreatePayloadSchema,
  type TenantInformationsPrimairesEcriturePayload,
} from '../../../services/api/repositories/tenants.repository';
import { switchTenant } from '../../../store/tenants.store';
import { useAuthStore } from '../../../store/auth.store';
import { toast } from '../../../hooks/useToast';
import { validateEmail } from '../../../lib/validators';

export type CreationStep = 'infos' | 'identite' | 'coordonnees' | 'responsable' | 'activites' | 'admin' | 'verification';
export const CREATION_STEPS: CreationStep[] = [
  'infos',
  'identite',
  'coordonnees',
  'responsable',
  'activites',
  'admin',
  'verification',
];

export type DisponibiliteState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';

export interface ReseauSocialEntry {
  id: string;
  plateforme: string;
  url: string;
}

export interface CreerOrganisationFormState {
  // 1. Organisation (Tenant)
  name: string;
  sousDomaine: string;
  description: string;
  logo: File | null;
  // 2. Identité légale (TenantInformationsPrimaires)
  formeJuridique: string;
  secteurActivite: string;
  raisonSociale: string;
  sigle: string;
  numeroRccm: string;
  numeroNif: string;
  numeroAgrement: string;
  dateCreationOuAgrement: string;
  // 3. Coordonnées
  adresseSiege: string;
  ville: string;
  province: string;
  pays: string;
  telephonePrincipal: string;
  telephoneSecondaire: string;
  emailContact: string;
  siteWeb: string;
  reseauxSociaux: ReseauSocialEntry[];
  // 4. Responsable légal & contact opérationnel
  responsableNomComplet: string;
  responsableFonction: string;
  responsableTelephone: string;
  responsableEmail: string;
  contactOperationnelIdentique: boolean;
  contactOperationnelNom: string;
  contactOperationnelFonction: string;
  contactOperationnelTelephone: string;
  contactOperationnelEmail: string;
  // 5. Activités
  effectifEstime: string;
  zoneCouverture: string;
  descriptionActivites: string;
  // 6. Compte administrateur
  identifiant: string;
  password: string;
  passwordConfirm: string;
}

const INITIAL_STATE: CreerOrganisationFormState = {
  name: '',
  sousDomaine: '',
  description: '',
  logo: null,
  formeJuridique: '',
  secteurActivite: '',
  raisonSociale: '',
  sigle: '',
  numeroRccm: '',
  numeroNif: '',
  numeroAgrement: '',
  dateCreationOuAgrement: '',
  adresseSiege: '',
  ville: '',
  province: '',
  pays: 'Gabon',
  telephonePrincipal: '',
  telephoneSecondaire: '',
  emailContact: '',
  siteWeb: '',
  reseauxSociaux: [],
  responsableNomComplet: '',
  responsableFonction: '',
  responsableTelephone: '',
  responsableEmail: '',
  contactOperationnelIdentique: true,
  contactOperationnelNom: '',
  contactOperationnelFonction: '',
  contactOperationnelTelephone: '',
  contactOperationnelEmail: '',
  effectifEstime: '',
  zoneCouverture: '',
  descriptionActivites: '',
  identifiant: '',
  password: '',
  passwordConfirm: '',
};

const DEBOUNCE_MS = 500;

export interface CreationResult {
  name: string;
  domaine: string;
  identifiant: string;
  /** `false` si la fiche d'identité n'a pas pu être enregistrée juste après la création (best-effort, voir `submit`). */
  ficheEnregistree: boolean;
}

type FormErrors = Partial<Record<keyof CreerOrganisationFormState, string>>;

/** Construit le payload PATCH de la fiche d'identité à partir du formulaire -- voir tenantsRepository.updateInformationsPrimaires. */
function buildInformationsPrimairesPayload(form: CreerOrganisationFormState): TenantInformationsPrimairesEcriturePayload {
  const reseauxSociaux: Record<string, string> = {};
  for (const entry of form.reseauxSociaux) {
    if (entry.plateforme && entry.url.trim()) reseauxSociaux[entry.plateforme] = entry.url.trim();
  }
  const effectif = Number.parseInt(form.effectifEstime, 10);

  return {
    formeJuridique: form.formeJuridique,
    secteurActivite: form.secteurActivite,
    raisonSociale: form.raisonSociale.trim(),
    sigle: form.sigle.trim(),
    numeroRccm: form.numeroRccm.trim(),
    numeroNif: form.numeroNif.trim(),
    numeroAgrement: form.numeroAgrement.trim(),
    dateCreationOuAgrement: form.dateCreationOuAgrement || null,
    adresseSiege: form.adresseSiege.trim(),
    ville: form.ville.trim(),
    province: form.province,
    pays: form.pays.trim() || 'Gabon',
    telephonePrincipal: form.telephonePrincipal.trim(),
    telephoneSecondaire: form.telephoneSecondaire.trim(),
    emailContact: form.emailContact.trim(),
    siteWeb: form.siteWeb.trim(),
    reseauxSociaux,
    responsableNomComplet: form.responsableNomComplet.trim(),
    responsableFonction: form.responsableFonction.trim(),
    responsableTelephone: form.responsableTelephone.trim(),
    responsableEmail: form.responsableEmail.trim(),
    // Contact opérationnel : renseigné uniquement s'il est explicitement
    // DIFFÉRENT du responsable légal (voir docstring backend) -- sinon
    // laissé vide plutôt que dupliquer les mêmes valeurs dans 2 colonnes.
    ...(form.contactOperationnelIdentique
      ? {}
      : {
          contactOperationnelNom: form.contactOperationnelNom.trim(),
          contactOperationnelFonction: form.contactOperationnelFonction.trim(),
          contactOperationnelTelephone: form.contactOperationnelTelephone.trim(),
          contactOperationnelEmail: form.contactOperationnelEmail.trim(),
        }),
    effectifEstime: Number.isFinite(effectif) ? effectif : null,
    zoneCouverture: form.zoneCouverture.trim(),
    descriptionActivites: form.descriptionActivites.trim(),
  };
}

export function useCreerOrganisationForm() {
  const { login } = useAuthStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<CreerOrganisationFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [sousDomaineStatus, setSousDomaineStatus] = useState<DisponibiliteState>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CreationResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const requestIdRef = useRef(0);
  const reseauIdRef = useRef(0);

  const setField = useCallback(
    <K extends keyof CreerOrganisationFormState>(key: K, value: CreerOrganisationFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    [],
  );

  const addReseauSocial = useCallback(() => {
    reseauIdRef.current += 1;
    const id = `reseau-${reseauIdRef.current}`;
    setForm((prev) => ({ ...prev, reseauxSociaux: [...prev.reseauxSociaux, { id, plateforme: '', url: '' }] }));
  }, []);

  const updateReseauSocial = useCallback((id: string, patch: Partial<Omit<ReseauSocialEntry, 'id'>>) => {
    setForm((prev) => ({
      ...prev,
      reseauxSociaux: prev.reseauxSociaux.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    }));
  }, []);

  const removeReseauSocial = useCallback((id: string) => {
    setForm((prev) => ({ ...prev, reseauxSociaux: prev.reseauxSociaux.filter((entry) => entry.id !== id) }));
  }, []);

  // Vérification en direct du sous-domaine, débouncée -- revalidée de
  // toute façon côté serveur à la soumission finale (fenêtre de course
  // possible entre cette vérification et la création réelle).
  const checkSousDomaine = useCallback((value: string) => {
    const normalise = value.trim().toLowerCase();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!normalise) {
      setSousDomaineStatus('idle');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(normalise) || normalise.length < 3) {
      setSousDomaineStatus('invalid');
      return;
    }
    setSousDomaineStatus('checking');
    const requestId = ++requestIdRef.current;
    debounceRef.current = setTimeout(() => {
      tenantsRepository
        .checkDisponibilite(normalise)
        .then((res) => {
          if (requestIdRef.current !== requestId) return; // réponse obsolète (l'utilisateur a retapé entretemps)
          setSousDomaineStatus(!res.formatValide ? 'invalid' : res.disponible ? 'available' : 'taken');
        })
        .catch(() => {
          if (requestIdRef.current !== requestId) return;
          setSousDomaineStatus('error');
        });
    }, DEBOUNCE_MS);
  }, []);

  const setSousDomaine = useCallback(
    (value: string) => {
      setField('sousDomaine', value);
      checkSousDomaine(value);
    },
    [setField, checkSousDomaine],
  );

  const validateInfosStep = useCallback((): boolean => {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = "Le nom de l'organisation est requis.";
    if (!form.sousDomaine.trim()) next.sousDomaine = 'Le sous-domaine est requis.';
    else if (sousDomaineStatus === 'invalid')
      next.sousDomaine = 'Lettres minuscules, chiffres et tirets, 3 caractères minimum.';
    else if (sousDomaineStatus === 'taken') next.sousDomaine = 'Ce sous-domaine est déjà pris.';
    else if (sousDomaineStatus === 'checking') next.sousDomaine = 'Vérification en cours, patientez…';
    setErrors((prev) => ({ ...prev, ...next }));
    return Object.keys(next).length === 0;
  }, [form.name, form.sousDomaine, sousDomaineStatus]);

  const validateIdentiteStep = useCallback((): boolean => {
    const next: FormErrors = {};
    if (!form.formeJuridique) next.formeJuridique = 'La forme juridique est requise.';
    if (!form.secteurActivite) next.secteurActivite = "Le secteur d'activité est requis.";
    if (!form.raisonSociale.trim()) next.raisonSociale = 'La raison sociale est requise.';
    if (!form.numeroRccm.trim()) next.numeroRccm = 'Le numéro RCCM est requis.';
    if (!form.numeroNif.trim()) next.numeroNif = 'Le numéro NIF est requis.';
    if (!form.dateCreationOuAgrement) next.dateCreationOuAgrement = "La date de création / d'agrément est requise.";
    setErrors((prev) => ({ ...prev, ...next }));
    return Object.keys(next).length === 0;
  }, [form.formeJuridique, form.secteurActivite, form.raisonSociale, form.numeroRccm, form.numeroNif, form.dateCreationOuAgrement]);

  const validateCoordonneesStep = useCallback((): boolean => {
    const next: FormErrors = {};
    if (!form.adresseSiege.trim()) next.adresseSiege = 'Adresse du siège requise.';
    if (!form.ville.trim()) next.ville = 'Ville requise.';
    if (!form.province) next.province = 'Province requise.';
    if (!form.telephonePrincipal.trim()) next.telephonePrincipal = 'Téléphone principal requis.';
    if (!form.emailContact.trim()) next.emailContact = 'Email de contact requis.';
    else if (!validateEmail(form.emailContact.trim())) next.emailContact = 'Email invalide.';
    setErrors((prev) => ({ ...prev, ...next }));
    return Object.keys(next).length === 0;
  }, [form.adresseSiege, form.ville, form.province, form.telephonePrincipal, form.emailContact]);

  const validateResponsableStep = useCallback((): boolean => {
    const next: FormErrors = {};
    if (!form.responsableNomComplet.trim()) next.responsableNomComplet = 'Nom du responsable légal requis.';
    if (!form.responsableFonction.trim()) next.responsableFonction = 'Fonction du responsable légal requise.';
    if (!form.responsableTelephone.trim()) next.responsableTelephone = 'Téléphone du responsable légal requis.';
    if (!form.responsableEmail.trim()) next.responsableEmail = 'Email du responsable légal requis.';
    else if (!validateEmail(form.responsableEmail.trim())) next.responsableEmail = 'Email invalide.';
    if (!form.contactOperationnelIdentique) {
      if (form.contactOperationnelEmail.trim() && !validateEmail(form.contactOperationnelEmail.trim())) {
        next.contactOperationnelEmail = 'Email invalide.';
      }
    }
    setErrors((prev) => ({ ...prev, ...next }));
    return Object.keys(next).length === 0;
  }, [
    form.responsableNomComplet,
    form.responsableFonction,
    form.responsableTelephone,
    form.responsableEmail,
    form.contactOperationnelIdentique,
    form.contactOperationnelEmail,
  ]);

  const validateActivitesStep = useCallback((): boolean => {
    const next: FormErrors = {};
    if (!form.effectifEstime.trim()) next.effectifEstime = 'Effectif estimé requis.';
    else if (!/^\d+$/.test(form.effectifEstime.trim())) next.effectifEstime = 'Nombre entier positif attendu.';
    if (!form.descriptionActivites.trim()) next.descriptionActivites = 'Description des activités requise.';
    setErrors((prev) => ({ ...prev, ...next }));
    return Object.keys(next).length === 0;
  }, [form.effectifEstime, form.descriptionActivites]);

  const validateAdminStep = useCallback((): boolean => {
    const next: FormErrors = {};
    if (!form.identifiant.trim()) next.identifiant = 'Un email ou un numéro de téléphone est requis.';
    if (form.password.length < 8) next.password = '8 caractères minimum.';
    if (form.password !== form.passwordConfirm) next.passwordConfirm = 'Les mots de passe ne correspondent pas.';
    setErrors((prev) => ({ ...prev, ...next }));
    return Object.keys(next).length === 0;
  }, [form.identifiant, form.password, form.passwordConfirm]);

  const validateStep = useCallback(
    (step: CreationStep): boolean => {
      switch (step) {
        case 'infos':
          return validateInfosStep();
        case 'identite':
          return validateIdentiteStep();
        case 'coordonnees':
          return validateCoordonneesStep();
        case 'responsable':
          return validateResponsableStep();
        case 'activites':
          return validateActivitesStep();
        case 'admin':
          return validateAdminStep();
        case 'verification':
          return true;
        default:
          return true;
      }
    },
    [
      validateInfosStep,
      validateIdentiteStep,
      validateCoordonneesStep,
      validateResponsableStep,
      validateActivitesStep,
      validateAdminStep,
    ],
  );

  const goNext = useCallback(() => {
    const current = CREATION_STEPS[stepIndex];
    if (validateStep(current)) setStepIndex((i) => Math.min(i + 1, CREATION_STEPS.length - 1));
  }, [stepIndex, validateStep]);

  const goBack = useCallback(() => setStepIndex((i) => Math.max(i - 1, 0)), []);
  const goToStep = useCallback((index: number) => setStepIndex(Math.max(0, Math.min(index, CREATION_STEPS.length - 1))), []);

  const submit = useCallback(async () => {
    const stepsToValidate: CreationStep[] = ['infos', 'identite', 'coordonnees', 'responsable', 'activites', 'admin'];
    const results = stepsToValidate.map((step) => validateStep(step));
    const firstInvalid = results.findIndex((ok) => !ok);
    if (firstInvalid !== -1) {
      setStepIndex(CREATION_STEPS.indexOf(stepsToValidate[firstInvalid]));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = TenantCreatePayloadSchema.parse({
        name: form.name.trim(),
        sousDomaine: form.sousDomaine.trim().toLowerCase(),
        description: form.description.trim() || undefined,
        identifiant: form.identifiant.trim(),
        password: form.password,
        logo: form.logo ?? undefined,
      });
      const response = await tenantsRepository.create(payload);

      // Injection IMMÉDIATE dans le store -- toute requête suivante
      // (y compris le login et le PATCH de la fiche ci-dessous) doit
      // cibler CE tenant tout juste créé (voir store/tenants.store.ts).
      switchTenant({ domainHeaderValue: response.tenant.sousDomaine, name: response.tenant.name });

      // Best-effort, en cascade : un login raté ici ne doit pas
      // transformer une création RÉUSSIE en écran d'erreur -- le compte
      // existe bel et bien, il pourra toujours se connecter et compléter
      // sa fiche manuellement ensuite. Idem pour l'enregistrement de la
      // fiche d'identité, qui nécessite le login juste au-dessus.
      let ficheEnregistree = false;
      try {
        await login(form.identifiant.trim(), form.password);
        try {
          await tenantsRepository.updateInformationsPrimaires(buildInformationsPrimairesPayload(form));
          ficheEnregistree = true;
        } catch {
          toast(
            'info',
            "Fiche d'identité à compléter",
            "L'organisation est créée, mais l'enregistrement de la fiche a échoué -- complétez-la depuis votre espace administrateur.",
          );
        }
      } catch {
        toast(
          'info',
          'Connexion manuelle requise',
          "L'organisation est créée, mais la connexion automatique a échoué -- connectez-vous depuis le menu.",
        );
      }

      setResult({
        name: response.tenant.name,
        domaine: response.domaine,
        identifiant: response.admin.identifiant,
        ficheEnregistree,
      });
      toast('success', 'Organisation créée', `${response.tenant.name} est prête.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors de la création.';
      toast('error', 'Échec de la création', message);
      // Un sous-domaine pris entre la vérification live et la soumission
      // (course rare) doit renvoyer à l'étape 1 avec l'erreur visible,
      // pas laisser l'utilisateur bloqué sur l'étape de vérification.
      setStepIndex(0);
      setErrors((prev) => ({ ...prev, sousDomaine: message }));
    } finally {
      setIsSubmitting(false);
    }
  }, [form, login, validateStep]);

  return {
    stepIndex,
    steps: CREATION_STEPS,
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
  };
}
