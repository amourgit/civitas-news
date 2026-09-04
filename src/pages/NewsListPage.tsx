import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useNewsList } from '../features/news/hooks/useNewsList';
import { useNews } from '../features/news/hooks/useNews';
import { NewsGrid } from '../features/news/components/NewsGrid';
import { NewsFiltres } from '../features/news/components/NewsFiltres';
import { NewsDetailContent } from '../features/news/components/NewsDetailContent';
import { BottomSheet } from '../components/ui/BottomSheet';
import { SearchBar } from '../features/recherche/components/SearchBar';
import { NewsType } from '../types/global.types';
import { SlidersHorizontal } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

export default function NewsListPage() {
  const [search, setSearch] = useState('');
  const [selectedCategorieId, setSelectedCategorieId] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedType, setSelectedType] = useState<NewsType | 'all'>(
    () => (searchParams.get('type') as NewsType | null) ?? 'all',
  );
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [selectedOrganisationId, setSelectedOrganisationId] = useState('all');
  const [selectedEtablissementId, setSelectedEtablissementId] = useState('all');
  const [isFiltresOpen, setIsFiltresOpen] = useState(false);
  const filtresRef = useRef<HTMLDivElement>(null);
  const [selectedNewsSlug, setSelectedNewsSlug] = useState<string | null>(() => searchParams.get('news'));

  // Reste synchronisé si le paramètre change par un autre biais (retour
  // navigateur, lien externe cliqué alors que la page est déjà montée).
  useEffect(() => {
    setSelectedNewsSlug(searchParams.get('news'));
  }, [searchParams]);

  // Ferme la popup de filtres au clic en dehors (le clic sur l'icône
  // elle-même bascule déjà l'état via son propre onClick).
  useEffect(() => {
    if (!isFiltresOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (filtresRef.current && !filtresRef.current.contains(e.target as Node)) {
        setIsFiltresOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFiltresOpen]);

  const filtresActifs =
    selectedCategorieId !== 'all' ||
    selectedType !== 'all' ||
    selectedProvince !== 'all' ||
    selectedOrganisationId !== 'all' ||
    selectedEtablissementId !== 'all';

  const { newsList, sujets, isLoading } = useNewsList({
    search,
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

  const handleOpenDetail = (slug: string) => {
    setSelectedNewsSlug(slug);
    // ?news=slug rend l'URL partageable/copiable et réutilisable comme
    // lien de notification, alors que la route dédiée /news/:slug a été
    // débranchée au profit du BottomSheet.
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('news', slug);
      return next;
    });
  };

  const handleCloseDetail = () => {
    setSelectedNewsSlug(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('news');
      return next;
    });
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Rechercher une news par titre, mot-clé..."
          className="flex-1 max-w-md"
        />

        <div className="relative shrink-0" ref={filtresRef}>
          <button
            onClick={() => setIsFiltresOpen((v) => !v)}
            aria-label="Filtres"
            aria-expanded={isFiltresOpen}
            className={`relative flex items-center justify-center w-10 h-10 rounded-xl border transition-colors ${
              isFiltresOpen || filtresActifs
                ? 'bg-[#5B4DFF] border-[#5B4DFF] text-white'
                : 'bg-white dark:bg-[#1A1F4D] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {filtresActifs && !isFiltresOpen && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#5B4DFF] ring-2 ring-white dark:ring-[#0E1338]" />
            )}
          </button>

          <AnimatePresence>
            {isFiltresOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-full mt-2 z-30 w-[min(90vw,420px)] rounded-2xl bg-white/10 dark:bg-black/20 backdrop-blur-2xl shadow-2xl p-3"
              >
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <NewsGrid
        newsList={newsList || sujets}
        isLoading={isLoading}
        onResetFilters={() => {
          setSearch('');
          setSelectedCategorieId('all');
          setSelectedType('all');
          setSelectedProvince('all');
          setSelectedOrganisationId('all');
          setSelectedEtablissementId('all');
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
