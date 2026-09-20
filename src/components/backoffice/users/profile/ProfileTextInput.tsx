// ============================================================
// src/components/backoffice/users/profile/ProfileTextInput.tsx
// Champ texte « en ligne » de la fiche Utilisateur : il se glisse À LA
// PLACE de la valeur affichée, dans le même cadre.
//
// Reste bâti sur `Input` (src/components/ui/Input.tsx), point d'entrée
// unique des champs texte du projet -- mais son label flottant est
// masqué (`hidden`) : le cadre affiche déjà son propre libellé au-dessus
// de la valeur, exactement comme en lecture. Le nom accessible vient du
// <label htmlFor> du cadre (mode tuile) ou de `aria-label` (bannière).
//
// `cn()` ne fusionne pas les classes Tailwind (pas de twMerge) : pour
// surcharger la taille/bordure/couleur de base d'`Input` sans dépendre
// de l'ordre de génération du CSS, les surcharges passent par un
// sélecteur DESCENDANT (`[&_input]:…`, spécificité 0-1-1) plus fort que
// les utilitaires simples (0-1-0) d'Input -- déterministe, sans `!important`.
// ============================================================

import React from 'react';
import { Input, type InputProps } from '../../../ui/Input';
import { cn } from '../../../../lib/utils';

type Variant = 'tile' | 'banner';

const VARIANT_CLASSES: Record<Variant, string> = {
  // Valeur d'un cadre : même corps de texte que la valeur affichée en lecture.
  tile: cn(
    '[&_input]:py-0.5 [&_input]:text-sm [&_input]:font-semibold',
    '[&_input]:text-gray-900 dark:[&_input]:text-white',
    '[&_input]:border-b [&_input]:border-gray-300 dark:[&_input]:border-gray-600',
    '[&_input:focus]:border-[#5B4DFF] dark:[&_input:focus]:border-[#7B61FF]',
    '[&_input::placeholder]:text-gray-300 dark:[&_input::placeholder]:text-gray-600',
    'dark:[&_input]:[color-scheme:dark]',
  ),
  // Nom dans la bannière dégradée : blanc sur violet, centré.
  banner: cn(
    '[&_input]:py-1 [&_input]:text-lg [&_input]:font-bold [&_input]:text-center [&_input]:text-white',
    '[&_input]:border-b [&_input]:border-white/40 dark:[&_input]:border-white/40',
    '[&_input:focus]:border-white',
    '[&_input::placeholder]:text-white/50',
  ),
};

const INVALID_CLASSES = '[&_input]:border-red-400 dark:[&_input]:border-red-500';

export interface ProfileTextInputProps extends Omit<InputProps, 'labelClassName' | 'inputClassName'> {
  variant?: Variant;
  invalid?: boolean;
}

export function ProfileTextInput({
  variant = 'tile', invalid = false, className, ...props
}: ProfileTextInputProps) {
  return (
    <Input
      autoComplete="off"
      {...props}
      aria-invalid={invalid || undefined}
      labelClassName="hidden"
      className={cn(VARIANT_CLASSES[variant], invalid && INVALID_CLASSES, className)}
    />
  );
}
