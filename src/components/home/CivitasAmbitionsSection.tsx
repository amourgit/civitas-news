import React, { useState } from 'react';
import {
  civitasInfoMockData,
} from '../../services/api/mocks/organisation.mock';
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
  const [activeTab, setActiveTab] = useState<'mission' | 'ia' | 'piliers' | 'contact'>('mission');
  const [copiedContact, setCopiedContact] = useState(false);

  const data = civitasInfoMockData;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(data.contact.email);
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
              À Propos de CIVITAS & Nos Ambitions
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium leading-relaxed">
              {data.slogan}
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
          { id: 'mission', label: 'Mission & Vision', icon: <Compass className="w-3.5 h-3.5" /> },
          { id: 'ia', label: 'Médiation IA & Afrique', icon: <Cpu className="w-3.5 h-3.5" /> },
          { id: 'piliers', label: 'Piliers & Objectifs', icon: <Target className="w-3.5 h-3.5" /> },
          { id: 'contact', label: 'Siège & Localisation', icon: <MapPin className="w-3.5 h-3.5" /> },
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
        {/* TAB 1: Mission & Vision */}
        {activeTab === 'mission' && (
          <div className="space-y-4 animate-fadeIn">
            <p className="text-xs sm:text-sm leading-relaxed font-medium text-gray-700 dark:text-gray-300">
              {data.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#5B4DFF] dark:text-blue-400 font-extrabold text-xs sm:text-sm uppercase tracking-wide">
                  <Target className="w-4 h-4" />
                  <span>Notre Mission Fixée</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-semibold leading-relaxed">
                  {data.mission}
                </p>
              </div>

              <div className="space-y-2 md:border-l md:border-gray-200 md:dark:border-gray-800 md:pl-6">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs sm:text-sm uppercase tracking-wide">
                  <Compass className="w-4 h-4" />
                  <span>Notre Vision Continentale</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-semibold leading-relaxed">
                  {data.vision}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Médiation IA & Contraintes Africaines */}
        {activeTab === 'ia' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="pl-4 border-l-4 border-[#5B4DFF] space-y-2 py-1">
              <div className="flex items-center gap-2 text-[#5B4DFF] font-black text-xs sm:text-sm uppercase tracking-wider">
                <Cpu className="w-4 h-4" />
                <span>{data.positionnementIA.titre}</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200 leading-relaxed">
                {data.positionnementIA.resume}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#5B4DFF]" />
                Engagements de Médiation & Intégration Stratégique :
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.positionnementIA.pointsCles.map((point, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2.5 py-1"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-snug">
                      {point}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Piliers & Objectifs */}
        {activeTab === 'piliers' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.piliers.map((pilier) => (
                <div
                  key={pilier.id}
                  className="py-2 px-1 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-none bg-[#5B4DFF]/10 text-[#5B4DFF]">
                      {pilier.badge}
                    </span>
                  </div>
                  <h5 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white font-display">
                    {pilier.titre}
                  </h5>
                  <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                    {pilier.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider mb-3 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-500" />
                Objectifs & Indicateurs Clés 2026 - 2030 :
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.objectifs2026.map((obj, i) => (
                  <div
                    key={i}
                    className="py-2 border-l-2 border-[#5B4DFF]/40 pl-3 space-y-0.5"
                  >
                    <div className="text-base sm:text-lg font-black text-[#5B4DFF] dark:text-sky-400 font-display">
                      {obj.valeur}
                    </div>
                    <div className="text-[11px] font-bold text-gray-900 dark:text-white">
                      {obj.label}
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-tight">
                      {obj.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Siège & Contacts */}
        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#5B4DFF]" />
                Localisation du Siège Social :
              </h4>

              <div className="space-y-3 text-xs font-medium text-gray-700 dark:text-gray-300">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#5B4DFF] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-gray-900 dark:text-white font-bold">
                      {data.localisation.ville}, {data.localisation.pays}
                    </strong>
                    <span>{data.localisation.adresse}</span>
                    <span className="block text-[10px] text-gray-400 mt-0.5">
                      GPS : {data.localisation.coordonnees}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{data.contact.horaires}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-sky-500 shrink-0" />
                  <span>{data.localisation.bureauPrincipal}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 md:border-l md:border-gray-200 md:dark:border-gray-800 md:pl-6">
              <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-emerald-500" />
                Coordonnées de Contact & Support :
              </h4>

              <div className="space-y-2 text-xs font-semibold text-gray-800 dark:text-gray-200">
                <a
                  href={`mailto:${data.contact.email}`}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 hover:text-[#5B4DFF] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#5B4DFF]" />
                    <span>Email Officiel : {data.contact.email}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </a>

                <a
                  href={`tel:${data.contact.telephone.split('/')[0].trim()}`}
                  className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 hover:text-[#5B4DFF] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    <span>Téléphone : {data.contact.telephone}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </a>

                <a
                  href={data.contact.siteWeb}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between py-2 hover:text-[#5B4DFF] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-sky-500" />
                    <span>Site Web : {data.contact.siteWeb}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
