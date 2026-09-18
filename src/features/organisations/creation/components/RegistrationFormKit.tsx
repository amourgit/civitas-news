// ============================================================
// src/features/organisations/creation/components/RegistrationFormKit.tsx
// Kit de composants purement présentationnels pour l'identité visuelle
// "formulaire d'enregistrement papier" de CreerOrganisationPage : bandeau
// de section plein-largeur, ligne de champ (libellé à gauche + soulignement),
// groupe de radios, interrupteur, champ mot de passe -- AUCUNE logique
// métier ici (état/validation restent entièrement dans
// useCreerOrganisationForm, voir la page). Isolé dans son propre fichier
// pour que la page reste lisible et que ces primitives soient réutilisables
// si d'autres écrans veulent la même identité visuelle plus tard.
//
// Palette propre à cette identité (volontairement distincte du violet
// #5B4DFF utilisé partout ailleurs dans l'app -- cf. consigne : cette
// page a sa propre identité visuelle dédiée) :
//   #01526B  teal profond   -- bandeaux, bordures, titres
//   #00C2F5  cyan accent    -- liseré du bandeau d'en-tête
//   #262626  encre          -- texte de saisie / libellés
//   #B7B7B7  ligne neutre   -- soulignement au repos
// ============================================================
import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../../../lib/utils';

export const REG_TEAL = '#01526B';
export const REG_CYAN = '#00C2F5';
export const REG_INK = '#262626';
export const REG_LINE = '#B7B7B7';

/** Largeur de la colonne de libellé -- partagée par Field (label) et son ErrorText (indentation de l'erreur sous le champ, pas sous le libellé). */
const LABEL_COL = 'w-[104px] sm:w-[168px]';
export const LABEL_PAD = 'pl-[116px] sm:pl-[184px]';

// --------------------------------------------------------------
// Marque -- 3 losanges superposés (reprise fidèle du logo du gabarit),
// dans la palette teal/cyan ci-dessus plutôt que les couleurs du
// gabarit d'origine.
// --------------------------------------------------------------
export function DiamondMark({ className, scale = 1 }: { className?: string; scale?: number }) {
  return (
    <div
      className={cn('relative h-[46px] w-[64px] shrink-0 origin-left', className)}
      style={scale !== 1 ? { transform: `scale(${scale})` } : undefined}
      aria-hidden="true"
    >
      <span className="absolute left-[18px] top-1/2 h-[30px] w-[30px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#357486]" />
      <span className="absolute left-[32px] top-1/2 h-[30px] w-[30px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#1A9EC4]" />
      <span className="absolute left-[46px] top-1/2 h-[30px] w-[30px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#7FE2FF]" />
    </div>
  );
}

// --------------------------------------------------------------
// Bandeau de section plein-largeur (fond teal, titre blanc majuscule) --
// équivalent visuel de "PERSONAL INFORMATION" / "CONTACT INFORMATION"
// dans le gabarit.
// --------------------------------------------------------------
export function SectionBar({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-[#01526B] px-5 py-2.5 sm:px-10 sm:py-3">
      <h2 className="text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-white sm:text-[13px]">{children}</h2>
      {right}
    </div>
  );
}

/** Petit sous-titre teal en majuscules -- pour distinguer 2 blocs à l'intérieur d'une même section (ex : "Responsable légal" / "Contact opérationnel"). */
export function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-1 mt-3 text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-[#01526B] first:mt-0 sm:text-[11px]">
      {children}
    </h3>
  );
}

// --------------------------------------------------------------
// Ligne de champ : libellé à gauche (colonne fixe, petites capitales
// grasses) + contenu à droite (soulignement). `children` porte
// n'importe quel contrôle (UnderlineInput, RadioGroup, un combobox...).
// --------------------------------------------------------------
export function Field({
  label,
  required,
  htmlFor,
  error,
  children,
  align = 'end',
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
  /** 'end' aligne le libellé sur la ligne de base du champ (défaut) ; 'start' pour un contenu multi-ligne (textarea). */
  align?: 'end' | 'start';
}) {
  return (
    <div className="w-full">
      <div className={cn('flex gap-3 sm:gap-4', align === 'end' ? 'items-end' : 'items-start')}>
        <label
          htmlFor={htmlFor}
          className={cn(
            LABEL_COL,
            'shrink-0 pb-[7px] text-[10px] font-bold uppercase leading-tight tracking-wide text-[#262626] sm:text-[11.5px]',
            align === 'start' && 'pt-0.5',
          )}
        >
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      {error && <p className={cn(LABEL_PAD, 'mt-1 text-[11px] font-medium text-red-500')}>{error}</p>}
    </div>
  );
}

/** Deux champs côte à côte sur desktop, empilés en dessous de sm. */
export function FieldPair({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-10">{children}</div>;
}

// --------------------------------------------------------------
// Contrôles "soulignés" -- même vocabulaire que le reste de l'app
// (Input.tsx utilise déjà border-b), mais libellé statique externe
// (porté par <Field>) plutôt que le libellé flottant animé de Input.
// --------------------------------------------------------------
const underlineBase =
  'w-full bg-transparent outline-none border-0 border-b pb-[7px] text-[13.5px] text-[#262626] placeholder:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50 transition-colors';

export const UnderlineInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean; suffix?: React.ReactNode }
>(({ className, hasError, suffix, ...props }, ref) => (
  <div className="relative">
    <input
      ref={ref}
      {...props}
      className={cn(underlineBase, hasError ? 'border-red-400' : 'border-[#B7B7B7] focus:border-[#01526B]', suffix && 'pr-7', className)}
    />
    {suffix && <div className="absolute right-0 top-1/2 -translate-y-1/2">{suffix}</div>}
  </div>
));
UnderlineInput.displayName = 'UnderlineInput';

export const UnderlineTextarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }
>(({ className, hasError, rows = 2, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    {...props}
    className={cn(underlineBase, 'resize-y', hasError ? 'border-red-400' : 'border-[#B7B7B7] focus:border-[#01526B]', className)}
  />
));
UnderlineTextarea.displayName = 'UnderlineTextarea';

/** Mot de passe souligné avec bascule afficher/masquer -- pendant local à cette identité visuelle (PasswordField/Input partagés utilisent le libellé flottant, incompatible avec le libellé externe de <Field>). */
export function UnderlinePasswordInput({
  value,
  onChange,
  hasError,
  id,
  autoComplete,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
  id?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(underlineBase, 'pr-7', hasError ? 'border-red-400' : 'border-[#B7B7B7] focus:border-[#01526B]')}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        className="absolute bottom-[7px] right-0 text-gray-400 hover:text-[#01526B]"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// --------------------------------------------------------------
// Radios en ligne (cercle + libellé) -- reprend le motif "○ Male ○
// Female" du gabarit.
// --------------------------------------------------------------
export function RadioGroup({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-2.5 pb-[7px] sm:gap-x-10">
      {options.map((opt) => {
        const checked = value === opt.value;
        return (
          <label key={opt.value} className="inline-flex cursor-pointer select-none items-center gap-2.5 text-[13px] text-[#262626] sm:text-[13.5px]">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={checked}
              onChange={() => onChange(opt.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                'inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border-[1.6px] peer-focus-visible:ring-2 peer-focus-visible:ring-[#01526B] peer-focus-visible:ring-offset-2',
                checked ? 'border-[#01526B]' : 'border-[#9a9a9a]',
              )}
            >
              {checked && <span className="h-[7px] w-[7px] rounded-full bg-[#01526B]" />}
            </span>
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}

// --------------------------------------------------------------
// Interrupteur (reprend le composant inline de l'ancienne page, recoloré teal).
// --------------------------------------------------------------
export function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-3 py-1">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-10 shrink-0 rounded-full transition-colors', checked ? 'bg-[#01526B]' : 'bg-gray-300')}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5',
          )}
        />
      </button>
      <span className="text-[13px] font-medium text-[#262626] sm:text-[13.5px]">{label}</span>
    </label>
  );
}

/** Bloc de contenu d'une section : padding cohérent + espacement vertical régulier entre les champs. */
export function SectionBody({ children, note }: { children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div className="space-y-5 px-5 py-6 sm:space-y-6 sm:px-10 sm:py-7">
      {note && <p className="text-[12px] text-gray-500">{note}</p>}
      {children}
    </div>
  );
}
