import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNewsList } from '../features/news/hooks/useNewsList';
import { NewsGrid } from '../features/news/components/NewsGrid';
import { NewsFiltres } from '../features/news/components/NewsFiltres';
import { NewsType } from '../types/global.types';
import { BarChart2, ShieldCheck, CheckSquare, MessageSquare, TrendingUp } from 'lucide-react';
import { NetflixHeroCarousel } from '../components/home/NetflixHeroCarousel';
import { HomeStatsPreviewSection } from '../components/home/HomeStatsPreviewSection';
import { CivitasAmbitionsSection } from '../components/home/CivitasAmbitionsSection';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<NewsType | 'all'>('all');

  const { newsList, sujets, isLoading } = useNewsList({
    category: selectedCategory,
    type: selectedType === 'all' ? undefined : selectedType,
  });

  const list = newsList || sujets;

  return (
    <div className="space-y-3 sm:space-y-4 pb-4">
      {/* Netflix-Style Automatic Hero Carousel */}
      <NetflixHeroCarousel newsList={list} sujets={list} />

      {/* Quick Metrics Strip */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-1 sm:gap-1.5">
        {[
          { label: 'News & Publications Actives', val: '86', icon: <CheckSquare className="w-3.5 h-3.5 text-[#5B4DFF]" /> },
          { label: 'Votes Comptabilisés', val: '38,940', icon: <BarChart2 className="w-3.5 h-3.5 text-emerald-500" /> },
          { label: 'Avis & Inquiétudes', val: '12,480', icon: <MessageSquare className="w-3.5 h-3.5 text-amber-500" /> },
          { label: 'Taux de Transparence', val: '100%', icon: <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" /> },
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-[#1A1F4D] p-1 sm:p-1.5 rounded-none border border-gray-100 dark:border-gray-800 flex items-center gap-1.5 shadow-sm">
            <div className="p-1 rounded-none bg-gray-50 dark:bg-gray-800">{item.icon}</div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white font-display leading-none">{item.val}</div>
              <div className="text-[9px] text-gray-400 font-semibold uppercase mt-0.5">{item.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Section Statistiques Preview */}
      <HomeStatsPreviewSection />

      {/* Section Autonome CIVITAS & Ambitions */}
      <CivitasAmbitionsSection />

      {/* Filter Bar */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white font-display flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#5B4DFF]" />
            News & Actualités Récentes
          </h2>
          <Link to="/news" className="text-xs font-bold text-[#5B4DFF] hover:underline">
            Voir tout →
          </Link>
        </div>

        <NewsFiltres
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedType={selectedType}
          onSelectType={setSelectedType}
        />

        <NewsGrid
          newsList={list}
          isLoading={isLoading}
          onResetFilters={() => {
            setSelectedCategory('all');
            setSelectedType('all');
          }}
        />
      </section>
    </div>
  );
}

