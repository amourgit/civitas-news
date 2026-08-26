import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Cpu,
  Sparkles,
  ShieldCheck,
  Target,
  ChevronRight,
  Clock,
  Compass,
  CheckCircle2,
  Share2,
  Info,
} from 'lucide-react';

export const CivitasAmbitionsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mission' | 'ia' | 'piliers' | 'contact'>('contact');
  const [copiedContact, setCopiedContact] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('civitasgabon@gmail.com');
    setCopiedContact(true);
    setTimeout(() => setCopiedContact(false), 2000);
  };

  return (
    <section className="w-full bg-white dark:bg-[#1A1F4D] rounded-none border border-gray-200/90 dark:border-gray-800 shadow-sm overflow-hidden my-4 transition-all">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-[#0b3c68] via-[#5B4DFF] to-[#0078d4] text-white p-4 sm:p-6 overflow-hidden">
        {/* Subtle background glow circle */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-[10px] sm:text-xs font-black uppercase tracking-wider bg-white/20 text-sky-100 border border-white/30 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Présentation & Vision Institutionnelle</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black font-display tracking-tight text-white leading-tight">
              Coordonnées de CIVITAS NEWS
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium leading-relaxed">
              CIVITAS NEWS — Informer. Inspirer. Connecter.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-white/15 hover:bg-white/25 border border-white/30 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedContact ? 'Email Copié !' : 'Nous Contacter'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar">
        {[
          { id: 'contact', label: 'Coordonnées', icon: <MapPin className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              activeTab === tab.id
                ? 'bg-[#5B4DFF] text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content Panels */}
      <div className="p-4 sm:p-6 text-gray-800 dark:text-gray-200">
        {/* TAB: Coordonnées */}
        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#5B4DFF]" />
                Localisation
              </h4>

              <div className="space-y-3 text-xs font-medium text-gray-700 dark:text-gray-300">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#5B4DFF] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-gray-900 dark:text-white font-bold">
                      CIVITAS NEWS
                    </strong>
                    <span>Libreville, Gabon 🇬🇦</span>
                    <span className="block text-[10px] text-gray-400 mt-0.5">
                      Plateforme numérique d'information dédiée à l'actualité, à l'innovation, à la jeunesse, à l'éducation, à la culture et aux initiatives qui façonnent notre société.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 md:border-l md:border-gray-200 md:dark:border-gray-800 md:pl-6">
              <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-emerald-500" />
                Coordonnées de Contact & Support
              </h4>

              <div className="space-y-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                <a
                  href="mailto:civitasgabon@gmail.com"
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 hover:text-[#5B4DFF] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#5B4DFF]" />
                    <span>Email : civitasgabon@gmail.com</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </a>

                <a
                  href="tel:+24165457663"
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 hover:text-[#5B4DFF] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    <span>Téléphone : +241 65 45 76 63</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </a>

                <a
                  href="tel:+24174343776"
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 hover:text-[#5B4DFF] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    <span>Téléphone : +241 74 34 37 76</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </a>

                <a
                  href="https://civitas-africa.vercel.app"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 hover:text-[#5B4DFF] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-sky-500" />
                    <span>Site Web : https://civitas-africa.vercel.app</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </a>

                <div className="flex items-center gap-2.5 py-2">
                  <span className="text-gray-600 dark:text-gray-400">Support : Disponible en ligne via la plateforme CIVITAS NEWS</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5 mb-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  Horaires
                </h4>
                <div className="space-y-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <span>Lundi – Dimanche : 08h00 – 17h00</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Fuseau horaire : WAT / UTC+1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
