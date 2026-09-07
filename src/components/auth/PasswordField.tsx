// ============================================================
// src/components/auth/PasswordField.tsx
// Champ mot de passe avec bascule afficher/masquer — réutilisé par
// LoginPage et RegisterPage.
// ============================================================

import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  required?: boolean;
}

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder = '••••••••',
  autoComplete = 'current-password',
  error,
  required,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Lock className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={Boolean(error)}
        inputClassName={cn('pl-6 pr-8', error && 'border-red-400 dark:border-red-500')}
        labelClassName="left-6"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
      {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
    </div>
  );
}
