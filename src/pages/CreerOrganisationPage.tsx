// ============================================================
// src/pages/CreerOrganisationPage.tsx
// Création self-service d'une organisation (= un tenant, architecture
// tenant-autonome -- voir Tenant.create_with_domain côté backend).
// 3 étapes : infos -> compte administrateur (créé DANS ce nouveau
// tenant, aucun rôle ailleurs) -> vérification + soumission (la
// création réelle n'a lieu qu'à la toute fin, pas avant).
// ============================================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, ExternalLink, Loader2, X } from 'lucide-react';
import { Stepper, type Step } from '../components/ui/Stepper';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import PasswordField from '../components/auth/PasswordField';
import { useCreerOrganisationForm } from '../features/organisations/creation/useCreerOrganisationForm';

const STEPPER_STEPS: Step[] = [
  { id: 'infos', title: 'Organisation', description: 'Nom et sous-domaine' },
  { id: 'admin', title: 'Administrateur', description: 'Le compte qui la gèrera' },
  { id: 'verification', title: 'Vérification', description: 'Relire et créer' },
];

function SousDomaineIndicateur({ status }: { status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error' }) {
  if (status === 'checking') return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;
  if (status === 'available') return <Check className="w-4 h-4 text-green-500" />;
  if (status === 'taken' || status === 'invalid') return <X className="w-4 h-4 text-red-500" />;
  return null;
}

export default function CreerOrganisationPage() {
  const navigate = useNavigate();
  const {
    stepIndex,
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

      <Card variant="glass" className="p-6 space-y-4">
        {stepIndex === 0 && (
          <>
            <Input
              label="Nom de l'organisation"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              autoFocus
            />
            {errors.name && <p className="-mt-2 text-xs font-medium text-red-500">{errors.name}</p>}

            <div className="relative">
              <Input
                label="Sous-domaine"
                value={form.sousDomaine}
                onChange={(e) => setField('sousDomaine', e.target.value.toLowerCase())}
                inputClassName="pr-8"
                placeholder="mon-organisation"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <SousDomaineIndicateur status={sousDomaineStatus} />
              </div>
            </div>
            {errors.sousDomaine ? (
              <p className="-mt-2 text-xs font-medium text-red-500">{errors.sousDomaine}</p>
            ) : (
              sousDomaineStatus === 'available' && (
                <p className="-mt-2 text-xs font-medium text-green-500">Ce sous-domaine est disponible.</p>
              )
            )}

            <Input
              label="Description (optionnelle)"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </>
        )}

        {stepIndex === 1 && (
          <>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ce compte sera le premier administrateur de <span className="font-medium">{form.name || 'cette organisation'}</span>,
              actif uniquement ici -- il n'aura aucun rôle ailleurs sur la plateforme.
            </p>
            <Input
              label="Email ou téléphone"
              value={form.identifiant}
              onChange={(e) => setField('identifiant', e.target.value)}
              autoFocus
            />
            {errors.identifiant && <p className="-mt-2 text-xs font-medium text-red-500">{errors.identifiant}</p>}

            <PasswordField
              id="creer-org-password"
              label="Mot de passe"
              value={form.password}
              onChange={(v) => setField('password', v)}
              autoComplete="new-password"
              error={errors.password}
            />
            <PasswordField
              id="creer-org-password-confirm"
              label="Confirmer le mot de passe"
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

        {stepIndex === 2 && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-gray-100 dark:border-white/10 pb-2">
              <span className="text-gray-500 dark:text-gray-400">Nom</span>
              <span className="font-medium text-gray-900 dark:text-white">{form.name}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 dark:border-white/10 pb-2">
              <span className="text-gray-500 dark:text-gray-400">Sous-domaine</span>
              <span className="font-medium text-gray-900 dark:text-white">{form.sousDomaine}</span>
            </div>
            {form.description && (
              <div className="flex justify-between border-b border-gray-100 dark:border-white/10 pb-2 gap-4">
                <span className="text-gray-500 dark:text-gray-400 shrink-0">Description</span>
                <span className="font-medium text-gray-900 dark:text-white text-right">{form.description}</span>
              </div>
            )}
            <div className="flex justify-between pb-2">
              <span className="text-gray-500 dark:text-gray-400">Administrateur</span>
              <span className="font-medium text-gray-900 dark:text-white">{form.identifiant}</span>
            </div>
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
