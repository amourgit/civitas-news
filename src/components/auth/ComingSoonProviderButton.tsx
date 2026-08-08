// ============================================================
// src/components/auth/ComingSoonProviderButton.tsx
// Emplacement UI prêt pour un futur fournisseur d'identité, affiché
// désactivé avec un badge "Bientôt disponible".
//
// Concerne ID-Gab (identité numérique nationale gabonaise) : à ce jour
// aucune API publique ni SDK connu n'est disponible pour l'intégrer
// réellement (ni côté Backend-Core-Base, ni documentation publique
// identifiée). Plutôt que de simuler une fausse intégration comme le
// faisait l'ancienne LoginPage.tsx (modal de démo), ce composant
// prépare la place dans l'UI sans rien prétendre de fonctionnel.
// Quand une vraie API ID-Gab existera : ajouter GoogleAuthView-like
// (IdGabAuthView) côté backend (token_manager/api/v1/views.py) +
// AUTH_ENDPOINTS.idGabLogin côté frontend, puis remplacer ce composant
// par un vrai bouton d'action sur le modèle de GoogleSignInButton.tsx.
// ============================================================

interface ComingSoonProviderButtonProps {
  label: string;
  icon: React.ReactNode;
}

export default function ComingSoonProviderButton({ label, icon }: ComingSoonProviderButtonProps) {
  return (
    <div
      title={`Connexion ${label} — intégration à venir`}
      className="w-full flex items-center justify-center gap-2 rounded-full border border-dashed border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-400 dark:text-gray-500 cursor-not-allowed select-none relative"
    >
      <span className="opacity-50">{icon}</span>
      {label}
      <span className="absolute -top-2 right-3 text-[9px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
        Bientôt
      </span>
    </div>
  );
}
