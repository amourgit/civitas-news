import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNewsList } from '../features/news/hooks/useNewsList';
import { useNews } from '../features/news/hooks/useNews';
import { useStatistiquesGlobales } from '../features/statistiques/hooks/useStatistiquesGlobales';
import { NewsGrid } from '../features/news/components/NewsGrid';
import { NewsFiltres } from '../features/news/components/NewsFiltres';
import { NewsDetailContent } from '../features/news/components/NewsDetailContent';
import { BottomSheet } from '../components/ui/BottomSheet';
import { NewsType } from '../types/global.types';
import { BarChart2, ShieldCheck, CheckSquare, MessageSquare, TrendingUp } from 'lucide-react';
import { NetflixHeroCarousel } from '../components/home/NetflixHeroCarousel';
import { HomeStatsPreviewSection } from '../components/home/HomeStatsPreviewSection';
import { MeteoLiquidGlassSection } from '../components/home/MeteoLiquidGlassSection';
import { Skeleton } from '../components/ui/Skeleton';

export default function HomePage() {
  const [selectedCategorieId, setSelectedCategorieId] = useState('all');
  const [selectedType, setSelectedType] = useState<NewsType | 'all'>('all');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [selectedOrganisationId, setSelectedOrganisationId] = useState('all');
  const [selectedEtablissementId, setSelectedEtablissementId] = useState('all');
  const [selectedNewsSlug, setSelectedNewsSlug] = useState<string | null>(null);

  const { newsList, sujets, isLoading } = useNewsList({
    categorieId: selectedCategorieId,
    type: selectedType === 'all' ? undefined : selectedType,
    province: selectedProvince,
    organisationId: selectedOrganisationId,
    etablissementId: selectedEtablissementId,
  });

  const { newsItem, setNewsItem, sujet, setSujet, isLoading: isDetailLoading } = useNews(selectedNewsSlug);
  const currentItem = newsItem || sujet;
  // Jeu NON filtré, déjà nécessaire pour la navigation "précédent/suivant"
  // du BottomSheet — réutilisé tel quel comme référence pour l'opacité
  // des options de NewsFiltres (voir NewsFiltres.tsx : `allNews`).
  const { newsList: allNews, sujets: allSujets } = useNewsList();

  const { stats, isLoading: isStatsLoading } = useStatistiquesGlobales();
  const formatNombre = (n: number) => n.toLocaleString('fr-FR');

  const list = newsList || sujets;

  const handleOpenDetail = (slug: string) => {
    setSelectedNewsSlug(slug);
  };

  const handleCloseDetail = () => {
    setSelectedNewsSlug(null);
  };

  return (
    <div className="space-y-3 sm:space-y-4 pb-4">
      {/* Netflix-Style Automatic Hero Carousel */}
      <NetflixHeroCarousel newsList={list} sujets={list} />

      {/* Quick Metrics Strip -- alimenté par le backend (statistiques/v1/globales/) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-1 sm:gap-1.5">
        {[
          {
            label: 'News & Publications Actives',
            val: stats ? formatNombre(stats.totalNewsActives) : null,
            icon: <CheckSquare className="w-3.5 h-3.5 text-[#5B4DFF]" />,
          },
          {
            label: 'Votes Comptabilisés',
            val: stats ? formatNombre(stats.totalVotes) : null,
            icon: <BarChart2 className="w-3.5 h-3.5 text-emerald-500" />,
          },
          {
            label: 'Avis & Inquiétudes',
            val: stats ? formatNombre(stats.totalCommentaires) : null,
            icon: <MessageSquare className="w-3.5 h-3.5 text-amber-500" />,
          },
          {
            label: 'Taux de Transparence',
            val: stats && typeof stats.tauxTransparence === 'number' ? `${Math.round(stats.tauxTransparence)}%` : null,
            icon: <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />,
          },
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-[#1A1F4D] p-1 sm:p-1.5 rounded-none border border-gray-100 dark:border-gray-800 flex items-center gap-1.5 shadow-sm">
            <div className="p-1 rounded-none bg-gray-50 dark:bg-gray-800">{item.icon}</div>
            <div>
              {isStatsLoading || item.val === null ? (
                <div className="h-3.5 w-10 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
              ) : (
                <div className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white font-display leading-none">{item.val}</div>
              )}
              <div className="text-[9px] text-gray-400 font-semibold uppercase mt-0.5">{item.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Section Météo des Provinces — cartes LiquidGlassCard, données dynamiques (mock isolé, voir features/meteo) */}
      <MeteoLiquidGlassSection />

      {/* Section Statistiques Preview */}
      {/* <HomeStatsPreviewSection /> */}

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
          selectedCategorieId={selectedCategorieId}
          onSelectCategorieId={setSelectedCategorieId}
          selectedType={selectedType}
          onSelectType={setSelectedType}
          selectedProvince={selectedProvince}
          onSelectProvince={setSelectedProvince}
          selectedOrganisationId={selectedOrganisationId}
          onSelectOrganisationId={setSelectedOrganisationId}
          selectedEtablissementId={selectedEtablissementId}
          onSelectEtablissementId={setSelectedEtablissementId}
          allNews={allNews || allSujets}
        />

        <NewsGrid
          newsList={list}
          isLoading={isLoading}
          onResetFilters={() => {
            setSelectedCategorieId('all');
            setSelectedType('all');
            setSelectedProvince('all');
            setSelectedOrganisationId('all');
            setSelectedEtablissementId('all');
          }}
          onOpenDetail={handleOpenDetail}
        />
      </section>

      {/* Bottom Sheet for News Details */}
      <BottomSheet
        isOpen={selectedNewsSlug !== null}
        onClose={handleCloseDetail}
        title={currentItem?.titre}
      >
        {isDetailLoading ? (
          <div className="space-y-3 max-w-5xl mx-auto py-2 px-1">
            <Skeleton height={220} variant="card" />
            <Skeleton height={40} variant="rectangular" />
            <Skeleton height={150} variant="rectangular" />
          </div>
        ) : currentItem ? (
          <NewsDetailContent
            newsItem={currentItem}
            onUpdate={setNewsItem || setSujet}
            allNews={allNews || allSujets}
            allSujets={allNews || allSujets}
            onOpenDetail={handleOpenDetail}
          />
        ) : null}
      </BottomSheet>
    </div>
  );
}

