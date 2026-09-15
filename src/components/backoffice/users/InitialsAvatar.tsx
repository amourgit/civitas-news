// ============================================================
// src/components/backoffice/users/InitialsAvatar.tsx
// Pastille avatar en initiales, partagée par UserOrbitCarousel (liste)
// et UserRecordDetail (fiche) -- l'API Utilisateur n'expose aucun
// champ photo de profil sur /users/v1/users/. Même palette de marque
// que le composant Avatar générique (src/components/ui/Avatar.tsx),
// mais à des tailles arbitraires en pixels : Avatar est limité à 4
// paliers (28/40/48/64px), insuffisant pour un avatar de fiche (~96px)
// comme pour les gabarits responsives de l'orbite.
// ============================================================

import React from 'react';

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return '?';
}

/** Nom d'affichage d'un utilisateur : prénom+nom si renseignés, sinon
 * nom d'utilisateur, sinon un identifiant lisible en dernier recours. */
export function getUserDisplayName(user: { id: number; firstName?: string; lastName?: string; username?: string }): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.username || `Utilisateur #${user.id}`;
}

export function InitialsAvatar({
  initials,
  sizePx,
  className = '',
}: {
  initials: string;
  sizePx: number;
  className?: string;
}) {
  return (
    <div
      style={{ width: sizePx, height: sizePx, fontSize: sizePx * 0.36 }}
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-[#5B4DFF] to-[#1A1F4D] text-white font-bold shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
}
