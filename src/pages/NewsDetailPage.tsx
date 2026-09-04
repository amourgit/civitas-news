import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useNews } from '../features/news/hooks/useNews';
import { useNewsList } from '../features/news/hooks/useNewsList';
import { NewsDetailHero } from '../features/news/components/detail/NewsDetailHero';
import { NewsDetailCoverImage } from '../features/news/components/detail/NewsDetailCoverImage';
import { NewsDetailArticleBody } from '../features/news/components/detail/NewsDetailArticleBody';
import { NewsDetailSidebar } from '../features/news/components/detail/NewsDetailSidebar';
import { NewsMediaGallery } from '../features/news/components/NewsMediaGallery';
import { NewsDocuments } from '../features/news/components/NewsDocuments';
import { SondageCard } from '../features/sondages/components/SondageCard';
import { CommentThread } from '../features/discussion/components/CommentThread';
import { Skeleton } from '../components/ui/Skeleton';
import NotFoundPage from './NotFoundPage';

/**
 * Page détail d'une News/Sujet -- accessible à son propre lien
 * (/news/:slug ou /sujets/:slug), indépendamment du BottomSheet
 * (voir NewsDetailContent.tsx, ouvert au clic sur une card). Même
 * logique métier (hooks/services), disposition entièrement nouvelle :
 * colonne principale (article) + sidebar séparée (widgets, articles
 * similaires/récents) -- voir NewsDetailSidebar.
 */
export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { news, setNews, isLoading, error } = useNews(slug);
  const { newsList } = useNewsList();
  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (news) document.title = `${news.titre} · CIVITAS NEWS`;
    return () => {
      document.title = 'CIVITAS NEWS';
    };
  }, [news]);

  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading) {
    return <NewsDetailPageSkeleton />;
  }

  if (error || !news) {
    return <NotFoundPage />;
  }

  return (
    <div className="w-full pb-16 max-w-6xl mx-auto px-1 sm:px-2">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 lg:gap-10 items-start">
        <main className="min-w-0 space-y-7 sm:space-y-8">
          <NewsDetailHero news={news} onUpdate={setNews} onScrollToComments={scrollToComments} />

          <NewsDetailCoverImage news={news} />

          <NewsDetailArticleBody news={news} />

          <NewsMediaGallery
            medias={news.medias}
            galerie={news.galerie}
            newsTitre={news.titre}
            sujetTitre={news.titre}
            defaultImage={news.image}
          />

          {news.sondages && news.sondages.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white font-display">
                Sondages associés
              </h2>
              {news.sondages.map((sondage) => (
                <SondageCard
                  key={sondage.id}
                  sondage={sondage}
                  onUpdate={(updatedSondage) =>
                    setNews({
                      ...news,
                      sondages: (news.sondages || []).map((s) => (s.id === updatedSondage.id ? updatedSondage : s)),
                    })
                  }
                />
              ))}
            </div>
          )}

          <NewsDocuments documents={news.documents} />

          <div ref={commentsRef} className="scroll-mt-24">
            <CommentThread sujetId={news.id} newsId={news.id} />
          </div>
        </main>

        <NewsDetailSidebar news={news} allNews={newsList} onUpdate={setNews} onScrollToComments={scrollToComments} />
      </div>
    </div>
  );
}

function NewsDetailPageSkeleton() {
  return (
    <div className="w-full pb-16 max-w-6xl mx-auto px-1 sm:px-2 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 lg:gap-10 items-start">
        <div className="min-w-0 space-y-6">
          <Skeleton variant="text" height={14} width="40%" />
          <Skeleton variant="text" height={38} width="85%" />
          <Skeleton variant="text" height={38} width="55%" />
          <div className="flex items-center gap-3 pt-2">
            <Skeleton variant="circular" height={40} width={40} />
            <Skeleton variant="text" height={12} width={160} />
          </div>
          <Skeleton variant="rectangular" height={420} />
          <Skeleton variant="text" height={14} />
          <Skeleton variant="text" height={14} />
          <Skeleton variant="text" height={14} width="80%" />
        </div>
        <div className="space-y-5">
          <Skeleton variant="card" height={140} />
          <Skeleton variant="card" height={180} />
          <Skeleton variant="card" height={220} />
        </div>
      </div>
    </div>
  );
}
