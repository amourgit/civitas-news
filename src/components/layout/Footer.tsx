import React from 'react';
import { Globe, Phone, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white dark:bg-slate-900/95 text-gray-600 dark:text-gray-400 text-[11px] py-2.5 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-800/80 select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-1 leading-tight">
        {/* Left: Brand, Copyright & Official Site */}
        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-gray-600 dark:text-gray-400">
          <span className="font-display font-extrabold text-gray-900 dark:text-white tracking-tight">
            CIVITAS<span className="text-[#7B61FF]">.NEWS</span>
          </span>
          <span className="text-gray-400 dark:text-gray-600">|</span>
          <span className="text-gray-500">© {new Date().getFullYear()}</span>
          <span className="text-gray-400 dark:text-gray-600">|</span>
          <a
            href="https://civitas-africa.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
          >
            <Globe className="w-3 h-3 text-[#7B61FF]" />
            <span className="underline decoration-gray-400 dark:decoration-gray-700 hover:decoration-gray-900 dark:hover:decoration-white">civitas-africa.vercel.app</span>
          </a>
        </div>

        {/* Right: Minimalist Contacts */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-gray-400">
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3 text-emerald-400" />
            <span>+241 65 45 47 76</span>
            <span className="text-gray-600">/</span>
            <span>+241 74 34 37 76</span>
          </div>
          <span className="text-gray-600">|</span>
          <a
            href="mailto:civitasgabon@gmail.com"
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <Mail className="w-3 h-3 text-blue-400" />
            <span>civitasgabon@gmail.com</span>
          </a>
        </div>
      </div>
    </footer>
  );
};


