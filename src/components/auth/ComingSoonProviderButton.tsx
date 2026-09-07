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
//
// Habillage visuel "verre dépoli" aligné sur AuthGlassKit.tsx (voir
// LoginModal.tsx) -- interface de props inchangée, ce composant n'est
// utilisé que par LoginModal.
// ============================================================

interface ComingSoonProviderButtonProps {
  label: string;
  icon: React.ReactNode;
}

export default function ComingSoonProviderButton({ label, icon }: ComingSoonProviderButtonProps) {
  return (
    <div
      title={`Connexion ${label} — intégration à venir`}
      className="civ-auth-glass-static relative flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 py-2.5 text-sm font-semibold text-gray-400 opacity-80 select-none dark:border-gray-700 dark:text-gray-500"
    >
      <span className="opacity-60">{icon}</span>
      {label}
      <span className="absolute -top-2 right-3 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-amber-700 uppercase dark:bg-amber-900/40 dark:text-amber-400">
        Bientôt
      </span>
    </div>
  );
}
