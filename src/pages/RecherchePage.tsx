import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchBar } from '../features/recherche/components/SearchBar';
import { useNewsList } from '../features/news/hooks/useNewsList';
import { useNews } from '../features/news/hooks/useNews';
import { NewsGrid } from '../features/news/components/NewsGrid';
import { NewsDetailContent } from '../features/news/components/NewsDetailContent';
import { BottomSheet } from '../components/ui/BottomSheet';
import { Tabs } from '../components/ui/Tabs';
import { Search, Filter, Sparkles } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

const CATEGORY_OPTIONS = [
  { id: 'all', label: 'Toutes les catégories' },
  { id: 'cat-transports', label: 'Transports & Mobilité' },
  { id: 'cat-numerique', label: 'Innovation & Numérique' },
  { id: 'cat-emploi', label: 'Emploi & Économie' },
  { id: 'cat-sante', label: 'Santé & Alimentation' },
  { id: 'cat-education', label: 'Éducation & Jeunesse' },
  { id: 'cat-ecologie', label: 'Environnement & Écologie' },
];

export default function RecherchePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('tous');
  const [selectedNewsSlug, setSelectedNewsSlug] = useState<string | null>(null);

  const { newsList, sujets, isLoading } = useNewsList({ search: query, category: selectedCategory !== 'all' ? selectedCategory : undefined });
  const rawList = newsList || sujets || [];

  const { newsItem, setNewsItem, sujet, setSujet, isLoading: isDetailLoading } = useNews(selectedNewsSlug);
  const currentItem = newsItem || sujet;
  const { newsList: allNews, sujets: allSujets } = useNewsList();

  const handleOpenDetail = (slug: string) => {
    setSelectedNewsSlug(slug);
  };

  const handleCloseDetail = () => {
    setSelectedNewsSlug(null);
  };

  // Filter list by tab if selected
  const list = rawList.filter((item) => {
    if (activeTab === 'consultations') return item.type === 'consultation';
    if (activeTab === 'sondages') return item.type === 'sondage' || (item.sondages && item.sondages.length > 0);
    if (activeTab === 'annonces') return item.type === 'annonce' || item.type === 'evenement';
    return true;
  });

  const handleSearchChange = (val: string) => {
    setQuery(val);
    if (val) {
      setSearchParams({ q: val });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="space-y-5 sm:space-y-8 pb-16">
      <div className="space-y-3 sm:space-y-4">
        <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-display flex items-center gap-2.5 sm:gap-3">
          <Search className="w-6 h-6 sm:w-8 sm:h-8 text-[#5B4DFF]" />
          Recherche & Explorations News
        </h1>

        <SearchBar
          value={query}
          onChange={handleSearchChange}
          placeholder="Rechercher par titre, mot-clé, thème ou province..."
          className="max-w-2xl"
        />
      </div>

      {/* Categories / Themes Options Container (Compact on mobile) */}
      <div className="space-y-2 bg-white dark:bg-[#1A1F4D] p-2.5 sm:p-4 rounded-xl border border-gray-200/80 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-[#5B4DFF]" />
          <span>Catégories & Thématiques</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
          {CATEGORY_OPTIONS.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#5B4DFF] text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs Filter (Compact on mobile) */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        <Tabs
          tabs={[
            { id: 'tous', label: 'Toutes les News', count: rawList.length },
            { id: 'consultations', label: 'Consultations', count: rawList.filter((s) => s.type === 'consultation').length },
            { id: 'sondages', label: 'Sondages', count: rawList.filter((s) => s.type === 'sondage' || (s.sondages && s.sondages.length > 0)).length },
            { id: 'annonces', label: 'Annonces & Projets', count: rawList.filter((s) => s.type === 'annonce' || s.type === 'evenement' || s.type === 'projet').length },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="pills"
        />
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 px-1 pt-1 border-b border-gray-200/50 dark:border-gray-800/50 pb-2">
        <span className="flex items-center gap-1.5 text-gray-900 dark:text-white font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          {list.length} résultat{list.length > 1 ? 's' : ''} trouvé{list.length > 1 ? 's' : ''}
        </span>
        {query && (
          <span className="text-[11px] text-gray-500">
            pour « <strong className="text-[#5B4DFF]">{query}</strong> »
          </span>
        )}
      </div>

      <NewsGrid newsList={list} isLoading={isLoading} onOpenDetail={handleOpenDetail} />

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


