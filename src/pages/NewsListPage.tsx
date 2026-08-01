import React, { useState } from 'react';
import { useNewsList } from '../features/news/hooks/useNewsList';
import { NewsGrid } from '../features/news/components/NewsGrid';
import { NewsFiltres } from '../features/news/components/NewsFiltres';
import { SearchBar } from '../features/recherche/components/SearchBar';
import { NewsType } from '../types/global.types';
import { Layers } from 'lucide-react';

export default function NewsListPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState<NewsType | 'all'>('all');

  const { newsList, sujets, isLoading } = useNewsList({
    search,
    category: selectedCategory,
    type: selectedType === 'all' ? undefined : selectedType,
  });

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
      />
    </div>
  );
}

export const SujetsListPage = NewsListPage;

