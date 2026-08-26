import React, { useState } from 'react';
import { useNewsList } from '../features/news/hooks/useNewsList';
import { useNews } from '../features/news/hooks/useNews';
import { NewsGrid } from '../features/news/components/NewsGrid';
import { NewsFiltres } from '../features/news/components/NewsFiltres';
import { NewsDetailContent } from '../features/news/components/NewsDetailContent';
import { BottomSheet } from '../components/ui/BottomSheet';
import { SearchBar } from '../features/recherche/components/SearchBar';
import { NewsType } from '../types/global.types';
import { Layers } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

export default function NewsListPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<NewsType | 'all'>('all');
  const [selectedNewsSlug, setSelectedNewsSlug] = useState<string | null>(null);

  const { newsList, sujets, isLoading } = useNewsList({
    search,
    category: selectedCategory,
    type: selectedType === 'all' ? undefined : selectedType,
  });

  const { newsItem, setNewsItem, sujet, setSujet, isLoading: isDetailLoading } = useNews(selectedNewsSlug);
  const currentItem = newsItem || sujet;
  const { newsList: allNews, sujets: allSujets } = useNewsList();

  const handleOpenDetail = (slug: string) => {
    setSelectedNewsSlug(slug);
  };

  const handleCloseDetail = () => {
    setSelectedNewsSlug(null);
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-display flex items-center gap-3">
            <Layers className="w-8 h-8 text-[#5B4DFF]" />
            Répertoire des News & Actualités
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Découvrez, filtrez et participez aux publications et débats nationaux et provinciaux.
          </p>
        </div>

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Rechercher une news par titre, mot-clé..."
          className="max-w-md"
        />
      </div>

      <NewsFiltres
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedType={selectedType}
        onSelectType={setSelectedType}
      />

      <NewsGrid
        newsList={newsList || sujets}
        isLoading={isLoading}
        onResetFilters={() => {
          setSearch('');
          setSelectedCategory('all');
          setSelectedType('all');
        }}
        onOpenDetail={handleOpenDetail}
      />

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

export const SujetsListPage = NewsListPage;

