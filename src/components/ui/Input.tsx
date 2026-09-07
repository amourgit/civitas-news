// ============================================================
// src/components/ui/Input.tsx
// Champ de saisie générique à label flottant animé lettre par lettre
// (le label se lit en overlay tant que le champ est vide et non
// focus, puis chaque caractère glisse vers le haut en `--color-zinc-500`
// dès que le champ prend le focus ou contient une valeur -- variable
// CSS générée nativement par Tailwind v4 pour sa palette par défaut,
// aucune définition supplémentaire requise dans src/index.css).
//
// SEUL point d'entrée pour un champ texte/number/date/email/password/
// url dans TOUT le projet : tout composant qui rendait auparavant un
// <input> natif doit importer et utiliser celui-ci (voir
// BackofficeRecordForm, CreerNewsPage, CreerSondagePage,
// LienGenerateurForm, PasswordField, InsertLinkDialog,
// InsertYoutubeDialog). Les champs de RECHERCHE (filtrage de listes,
// combobox FK) restent hors périmètre : voir GooeySearchBar.tsx pour
// ce cas d'usage distinct.
//
// `value` est repris tel quel sur le <input> (contrôlé) -- point
// important pour les formulaires d'édition du backoffice, qui doivent
// pouvoir préremplir le champ avec la valeur existante de
// l'enregistrement. `type` peut être surchargé via les props DOM
// standard (ex: type="password"/"number"/"date"/"email").
//
// `inputClassName`/`labelClassName` permettent aux appelants ayant
// besoin d'une icône préfixe (ex: PasswordField, InsertLinkDialog) de
// décaler l'input et le label flottant (ex: pl-9 / left-9) sans casser
// le style de base (bordure basse + label flottant) partagé par tous
// les autres champs.
// ============================================================

import React, { forwardRef, useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { cn } from '../../lib/utils';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  value?: string | number;
  /** Classes appliquées au conteneur externe (positionnement/marges dans le formulaire). */
  className?: string;
  /** Classes additionnelles fusionnées sur le <input> lui-même (ex: padding pour icône). */
  inputClassName?: string;
  /** Classes additionnelles fusionnées sur le label flottant (ex: décalage `left-*` assorti à `inputClassName`). */
  labelClassName?: string;
}

const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const letterVariants: Variants = {
  initial: {
    y: 0,
    color: 'inherit',
  },
  animate: {
    y: '-120%',
    color: 'var(--color-zinc-500)',
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      className = '',
      inputClassName = '',
      labelClassName = '',
      value = '',
      onFocus,
      onBlur,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const showLabel = isFocused || String(value).length > 0;

    return (
      <div className={cn('relative', className)}>
        <motion.div
          className={cn(
            'absolute top-1/2 -translate-y-1/2 pointer-events-none text-zinc-900 dark:text-zinc-50',
            labelClassName,
          )}
          variants={containerVariants}
          initial="initial"
          animate={showLabel ? 'animate' : 'initial'}
        >
          {label.split('').map((char, index) => (
            <motion.span
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className="inline-block text-sm"
              variants={letterVariants}
              style={{ willChange: 'transform' }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </motion.div>
        <input
          ref={ref}
          type="text"
          value={value}
          disabled={disabled}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
          className={cn(
            'outline-none border-b-2 border-zinc-900 dark:border-zinc-50 py-2 w-full text-base font-medium text-zinc-900 dark:text-zinc-50 bg-transparent placeholder-transparent disabled:opacity-60 disabled:cursor-not-allowed',
            inputClassName,
          )}
        />
      </div>
    );
  },
);
Input.displayName = 'Input';
