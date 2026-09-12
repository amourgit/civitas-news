// ============================================================
// src/features/organisations/creation/useCreerOrganisationForm.ts
// État + validation du formulaire multi-étapes de création d'une
// organisation (= un tenant, voir Tenant.create_with_domain côté
// backend). 3 étapes : infos du tenant -> compte administrateur
// (créé DANS le nouveau tenant, aucun rôle ailleurs) -> vérification
// et soumission (la création réelle n'a lieu qu'ici, pas avant).
// ============================================================
import { useCallback, useEffect, useRef, useState } from 'react';
import { tenantsRepository, TenantCreatePayloadSchema } from '../../../services/api/repositories/tenants.repository';
import { switchTenant } from '../../../store/tenants.store';
import { useAuthStore } from '../../../store/auth.store';
import { toast } from '../../../hooks/useToast';

export type CreationStep = 'infos' | 'admin' | 'verification';
export const CREATION_STEPS: CreationStep[] = ['infos', 'admin', 'verification'];

export type DisponibiliteState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error';

export interface CreerOrganisationFormState {
  name: string;
  sousDomaine: string;
  description: string;
  identifiant: string;
  password: string;
  passwordConfirm: string;
}

const INITIAL_STATE: CreerOrganisationFormState = {
  name: '',
  sousDomaine: '',
  description: '',
  identifiant: '',
  password: '',
  passwordConfirm: '',
};

const DEBOUNCE_MS = 500;

export interface CreationResult {
  name: string;
  domaine: string;
  identifiant: string;
}

export function useCreerOrganisationForm() {
  const { login } = useAuthStore();
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<CreerOrganisationFormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof CreerOrganisationFormState, string>>>({});
  const [sousDomaineStatus, setSousDomaineStatus] = useState<DisponibiliteState>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<CreationResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const requestIdRef = useRef(0);

  const setField = useCallback(
    <K extends keyof CreerOrganisationFormState>(key: K, value: CreerOrganisationFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    },
    [],
  );

  // Vérification en direct du sous-domaine, débouncée -- revalidée de
  // toute façon côté serveur à la soumission finale (fenêtre de course
  // possible entre cette vérification et la création réelle).
  useEffect(() => {
    const value = form.sousDomaine.trim().toLowerCase();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value) {
      setSousDomaineStatus('idle');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(value) || value.length < 3) {
      setSousDomaineStatus('invalid');
      return;
    }
    setSousDomaineStatus('checking');
    const requestId = ++requestIdRef.current;
    debounceRef.current = setTimeout(() => {
      tenantsRepository
        .checkDisponibilite(value)
        .then((res) => {
          if (requestIdRef.current !== requestId) return; // réponse obsolète (l'utilisateur a retapé entretemps)
          setSousDomaineStatus(!res.formatValide ? 'invalid' : res.disponible ? 'available' : 'taken');
        })
        .catch(() => {
          if (requestIdRef.current !== requestId) return;
          setSousDomaineStatus('error');
        });
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form.sousDomaine]);

  const validateInfosStep = useCallback((): boolean => {
    const next: Partial<Record<keyof CreerOrganisationFormState, string>> = {};
    if (!form.name.trim()) next.name = "Le nom de l'organisation est requis.";
    if (!form.sousDomaine.trim()) next.sousDomaine = 'Le sous-domaine est requis.';
    else if (sousDomaineStatus === 'invalid')
      next.sousDomaine = 'Lettres minuscules, chiffres et tirets, 3 caractères minimum.';
    else if (sousDomaineStatus === 'taken') next.sousDomaine = 'Ce sous-domaine est déjà pris.';
    else if (sousDomaineStatus === 'checking') next.sousDomaine = 'Vérification en cours, patientez…';
    setErrors((prev) => ({ ...prev, ...next }));
    return Object.keys(next).length === 0;
  }, [form.name, form.sousDomaine, sousDomaineStatus]);

  const validateAdminStep = useCallback((): boolean => {
    const next: Partial<Record<keyof CreerOrganisationFormState, string>> = {};
    if (!form.identifiant.trim()) next.identifiant = 'Un email ou un numéro de téléphone est requis.';
    if (form.password.length < 8) next.password = '8 caractères minimum.';
    if (form.password !== form.passwordConfirm) next.passwordConfirm = 'Les mots de passe ne correspondent pas.';
    setErrors((prev) => ({ ...prev, ...next }));
    return Object.keys(next).length === 0;
  }, [form.identifiant, form.password, form.passwordConfirm]);

  const goNext = useCallback(() => {
    const current = CREATION_STEPS[stepIndex];
    const valid = current === 'infos' ? validateInfosStep() : current === 'admin' ? validateAdminStep() : true;
    if (valid) setStepIndex((i) => Math.min(i + 1, CREATION_STEPS.length - 1));
  }, [stepIndex, validateInfosStep, validateAdminStep]);

  const goBack = useCallback(() => setStepIndex((i) => Math.max(i - 1, 0)), []);
  const goToStep = useCallback((index: number) => setStepIndex(Math.max(0, Math.min(index, CREATION_STEPS.length - 1))), []);

  const submit = useCallback(async () => {
    if (!validateInfosStep() || !validateAdminStep()) return;
    setIsSubmitting(true);
    try {
      const payload = TenantCreatePayloadSchema.parse({
        name: form.name.trim(),
        sousDomaine: form.sousDomaine.trim().toLowerCase(),
        description: form.description.trim() || undefined,
        identifiant: form.identifiant.trim(),
        password: form.password,
      });
      const response = await tenantsRepository.create(payload);

      // Injection IMMÉDIATE dans le store -- toute requête suivante
      // (y compris le login ci-dessous) doit cibler CE tenant tout
      // juste créé, pas celui qui était courant avant (voir
      // store/tenants.store.ts, "un seul tenant courant").
      switchTenant({ domainHeaderValue: response.tenant.sousDomaine, name: response.tenant.name });

      // L'écran de succès affirme "le compte administrateur est déjà
      // actif" -- vrai côté données, mais la session du NAVIGATEUR ne
      // l'est pas tant qu'on n'a pas explicitement appelé login() avec
      // les identifiants qu'on vient de saisir. Sans ça, l'utilisateur
      // revient à l'accueil anonyme et doit tout ressaisir à la main.
      // Best-effort : un login raté ici ne doit pas transformer une
      // création RÉUSSIE en écran d'erreur -- le compte existe bel et
      // bien, il pourra toujours se connecter manuellement ensuite.
      try {
        await login(form.identifiant.trim(), form.password);
      } catch {
        toast(
          'info',
          'Connexion manuelle requise',
          "L'organisation est créée, mais la connexion automatique a échoué -- connectez-vous depuis le menu."
        );
      }

      setResult({ name: response.tenant.name, domaine: response.domaine, identifiant: response.admin.identifiant });
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
  }, [form, validateInfosStep, validateAdminStep]);

  return {
    stepIndex,
    steps: CREATION_STEPS,
    form,
    setField,
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
