import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useNewsList } from '../features/news/hooks/useNewsList';
import { useNews } from '../features/news/hooks/useNews';
import { NewsGrid } from '../features/news/components/NewsGrid';
import { NewsFiltres } from '../features/news/components/NewsFiltres';
import { NewsDetailContent } from '../features/news/components/NewsDetailContent';
import { BottomSheet } from '../components/ui/BottomSheet';
import { GooeySearchBar, type GooeySearchSuggestion } from '../components/ui/GooeySearchBar';
import { useSetTopbarContent } from '../context/TopbarSlotsContext';
import { NewsType } from '../types/global.types';
import { filterNewsByFacets, hasActiveNewsFacetFilters } from '../features/news/utils/newsFilters';
import { useReferentiels } from '../features/news/hooks/useReferentiels';
import { PROVINCES_GABON } from '../features/news/constants/newsFieldOptions';
import { SlidersHorizontal } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

export default function NewsListPage() {
  const [search, setSearch] = useState('');
  const [selectedCategorieIds, setSelectedCategorieIds] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTypes, setSelectedTypes] = useState<NewsType[]>(() => {
    const fromUrl = searchParams.get('type') as NewsType | null;
    return fromUrl ? [fromUrl] : [];
  });
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedOrganisationIds, setSelectedOrganisationIds] = useState<string[]>([]);
  const [selectedEtablissementIds, setSelectedEtablissementIds] = useState<string[]>([]);
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

  const facetFilters = useMemo(
    () => ({
      categorieIds: selectedCategorieIds,
      types: selectedTypes,
      provinces: selectedProvinces,
      organisationIds: selectedOrganisationIds,
      etablissementIds: selectedEtablissementIds,
    }),
    [selectedCategorieIds, selectedTypes, selectedProvinces, selectedOrganisationIds, selectedEtablissementIds],
  );
  const filtresActifs = hasActiveNewsFacetFilters(facetFilters);

  // Seule la recherche texte part encore vers le backend : les 5 champs
  // à choix (Thèmes/Format/Province/Organisation/Établissement) sont
  // désormais multi-sélection (voir NewsFiltres) et DjangoFilterBackend
  // ne sait filtrer qu'UNE valeur à la fois par champ -- ils sont donc
  // appliqués ici, côté frontend, sur le résultat de la recherche (voir
  // features/news/utils/newsFilters.ts).
  const { newsList, sujets, isLoading } = useNewsList({ search });
  const searchScopedList = newsList || sujets;
  const filteredList = useMemo(() => filterNewsByFacets(searchScopedList, facetFilters), [searchScopedList, facetFilters]);

  const { newsItem, setNewsItem, sujet, setSujet, isLoading: isDetailLoading } = useNews(selectedNewsSlug);
  const currentItem = newsItem || sujet;
  // Jeu NON filtré (ni recherche, ni champs), déjà nécessaire pour la
  // navigation "précédent/suivant" du BottomSheet — réutilisé tel quel
  // comme référence pour l'opacité des options de NewsFiltres (voir
  // NewsFiltres.tsx : `allNews`).
  const { newsList: allNews, sujets: allSujets } = useNewsList();

  // Suggestions de la barre de recherche du topbar : tout ce qui
  // gravite autour de News (elle-même + ses tables liées) --
  // recalculé à chaque frappe côté frontend à partir des données déjà
  // chargées (allNews/allSujets, référentiels, provinces), et donné
  // TEL QUEL à GooeySearchBar qui n'a aucune connaissance de ces
  // tables : c'est ce point qui rend le composant réutilisable
  // ailleurs avec un tout autre jeu de données.
  const { categories, organisations, etablissements } = useReferentiels();
  const searchSuggestions = useMemo<GooeySearchSuggestion[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const seen = new Set<string>();
    const out: GooeySearchSuggestion[] = [];
    const push = (id: string, label: string, sublabel: string) => {
      const key = `${sublabel}:${label.toLowerCase()}`;
      if (seen.has(key) || out.length >= 8) return;
      seen.add(key);
      out.push({ id, label, sublabel });
    };
    (allNews || allSujets || []).forEach((n) => {
      if (n.titre.toLowerCase().includes(q)) push(`news-${n.id}`, n.titre, 'News');
    });
    categories.forEach((c) => { if (c.nom.toLowerCase().includes(q)) push(`cat-${c.id}`, c.nom, 'Thème'); });
    organisations.forEach((o) => { if (o.nom.toLowerCase().includes(q)) push(`org-${o.id}`, o.nom, 'Organisation'); });
    etablissements.forEach((e) => { if (e.nom.toLowerCase().includes(q)) push(`etab-${e.id}`, e.nom, 'Établissement'); });
    PROVINCES_GABON.forEach((p) => { if (p.toLowerCase().includes(q)) push(`prov-${p}`, p, 'Province'); });
    return out;
  }, [search, allNews, allSujets, categories, organisations, etablissements]);

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

  // Recherche + filtres publiés dans le niveau inférieur de la topbar
  // (voir context/TopbarSlotsContext.tsx) : fixe comme le reste de la
  // topbar, donc toujours accessible même en scrollant la grille de
  // news. `filtresRef`/`isFiltresOpen` restent des états 100% internes
  // à cette page ; seul l'EMPLACEMENT de rendu change, pas leur
  // fonctionnement (le popup de filtres reste positionné relativement
  // à son propre bouton, où qu'il soit monté dans l'arbre). Le contenu
  // publié utilise désormais les filtres multi-sélection (voir
  // NewsFiltres.tsx / features/news/utils/newsFilters.ts).
  useSetTopbarContent(
    'lower',
    <div className="flex w-full items-center justify-between gap-3">
      <GooeySearchBar
        value={search}
        onChange={setSearch}
        suggestions={searchSuggestions}
        placeholder="Rechercher une news..."
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
              className="absolute right-0 top-full mt-2 z-30 w-[min(90vw,420px)] max-h-[min(70vh,32rem)] overflow-y-auto no-scrollbar rounded-2xl bg-white/10 dark:bg-black/20 backdrop-blur-2xl shadow-2xl p-2 sm:p-2.5 md:p-3"
            >
              <NewsFiltres
                selectedCategorieIds={selectedCategorieIds}
                onChangeCategorieIds={setSelectedCategorieIds}
                selectedTypes={selectedTypes}
                onChangeTypes={setSelectedTypes}
                selectedProvinces={selectedProvinces}
                onChangeProvinces={setSelectedProvinces}
                selectedOrganisationIds={selectedOrganisationIds}
                onChangeOrganisationIds={setSelectedOrganisationIds}
                selectedEtablissementIds={selectedEtablissementIds}
                onChangeEtablissementIds={setSelectedEtablissementIds}
                allNews={allNews || allSujets}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>,
    [
      search,
      searchSuggestions,
      selectedCategorieIds,
      selectedTypes,
      selectedProvinces,
      selectedOrganisationIds,
      selectedEtablissementIds,
      isFiltresOpen,
      filtresActifs,
      allNews,
      allSujets,
    ],
  );

  return (
    <div className="space-y-6 pb-16">
      <NewsGrid
        newsList={filteredList}
        isLoading={isLoading}
        onResetFilters={() => {
          setSearch('');
          setSelectedCategorieIds([]);
          setSelectedTypes([]);
          setSelectedProvinces([]);
          setSelectedOrganisationIds([]);
          setSelectedEtablissementIds([]);
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
