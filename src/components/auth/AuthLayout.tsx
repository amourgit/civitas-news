// ============================================================
// src/components/auth/AuthLayout.tsx
// Layout partagé par LoginPage/RegisterPage : panneau de marque à
// gauche (masqué sur mobile), formulaire dans une carte à droite.
// Responsive, thème clair/sombre (classes dark: — piloté globalement
// par useUiStore, pas de logique de thème locale ici).
// ============================================================

import { Link } from 'react-router-dom';
import { Newspaper, ShieldCheck, Users } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const BRAND_POINTS = [
  { icon: Newspaper, text: "L'actualité civique de votre établissement, en temps réel" },
  { icon: Users, text: 'Sondages, commentaires et débats avec votre communauté' },
  { icon: ShieldCheck, text: 'Modération active, comptes vérifiés par établissement' },
];

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex bg-gray-50 dark:bg-gray-950">
      {/* Panneau de marque — visible à partir de lg, masqué en dessous */}
      <div className="hidden lg:flex lg:w-[44%] relative flex-col justify-between p-12 bg-gradient-to-br from-[#5B4DFF] via-[#7B6DFF] to-[#4338CA] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] [background-size:28px_28px]" />

        <Link to="/" className="relative flex items-center gap-2.5 font-black text-xl tracking-tight">
          <span className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Newspaper className="w-5 h-5" />
          </span>
          CIVITAS NEWS
        </Link>

        <div className="relative space-y-8">
          <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight">
            La plateforme civique de votre établissement
          </h1>
          <div className="space-y-5">
            {BRAND_POINTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <span className="mt-0.5 w-8 h-8 shrink-0 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </span>
                <p className="text-sm text-white/90 leading-relaxed pt-1.5">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} CIVITAS NEWS — EIGEN / EDUGABON
        </p>
      </div>

      {/* Formulaire */}
      <div className="flex-1 flex flex-col justify-center items-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[420px]">
          <Link to="/" className="lg:hidden flex items-center gap-2 font-black text-lg text-[#5B4DFF] mb-8 justify-center">
            <span className="w-8 h-8 rounded-xl bg-[#5B4DFF]/10 flex items-center justify-center">
              <Newspaper className="w-4.5 h-4.5" />
            </span>
            CIVITAS NEWS
          </Link>

          <div className="mb-7 text-center lg:text-left">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">{title}</h2>
            <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 sm:p-7">
            {children}
          </div>

          {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
