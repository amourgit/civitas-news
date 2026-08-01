import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchBar } from '../features/recherche/components/SearchBar';
import { Button } from '../components/ui/Button';
import { Home, Search, Sparkles, AlertCircle, Compass } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleSearchSubmit = (val: string) => {
    if (val.trim()) {
      navigate(`/recherche?q=${encodeURIComponent(val)}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-12 text-center">
      {/* Glassmorphism Brand Visual */}
      <div className="relative rounded-3xl p-10 bg-gradient-to-br from-[#5B4DFF]/20 via-purple-500/10 to-cyan-500/20 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-[#5B4DFF] text-white flex items-center justify-center mx-auto text-3xl font-extrabold shadow-lg shadow-[#5B4DFF]/40">
          404
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white font-display">
          Page Introuvable ou Déplacée
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          Le sujet ou la ressource citoyenne que vous cherchez n’existe plus, a été clôturée ou le lien de partage a expiré.
        </p>
      </div>

      {/* Quick Search Rebound */}
      <div className="max-w-md mx-auto space-y-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
          Rechercher un autre sujet
        </label>
        <SearchBar
          value={search}
          onChange={handleSearchSubmit}
          placeholder="Ex: Éducation, Santé, Numérique..."
        />
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link to="/">
          <Button variant="primary" size="lg" icon={<Home className="w-4 h-4" />}>
            Retourner à l'Accueil
          </Button>
        </Link>
        <Link to="/sujets">
          <Button variant="outline" size="lg" icon={<Compass className="w-4 h-4" />}>
            Parcourir les Sujets Actifs
          </Button>
        </Link>
      </div>

      {/* Popular Themes */}
      <div className="pt-8 border-t border-gray-100 dark:border-gray-800 space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-[#5B4DFF]" />
          Thématiques Populaires
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          {['Éducation & Université', 'Transport & Infrastructures', 'Santé Publique', 'Transition Numérique', 'Environnement'].map((tag) => (
            <Link
              key={tag}
              to={`/recherche?q=${encodeURIComponent(tag)}`}
              className="px-4 py-2 rounded-xl bg-white dark:bg-[#1A1F4D] border border-gray-200 dark:border-gray-700 text-xs font-semibold hover:border-[#5B4DFF] transition-all"
            >
              {tag}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
