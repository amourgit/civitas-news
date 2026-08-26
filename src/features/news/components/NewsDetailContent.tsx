import React, { useRef } from 'react';
import { useNews } from '../hooks/useNews';
import { useNewsList } from '../hooks/useNewsList';
import { NewsHeaderSharePointStyle } from './NewsHeaderSharePointStyle';
import { NewsContenu } from './NewsContenu';
import { NewsMediaGallery } from './NewsMediaGallery';
import { NewsDocuments } from './NewsDocuments';
import { NewsSimilaires } from './NewsSimilaires';
import { SondageCard } from '../../sondages/components/SondageCard';
import { CommentThread } from '../../discussion/components/CommentThread';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ArrowLeft, Building, Calendar, Info, ShieldCheck } from 'lucide-react';
import NotFoundPage from '../../../pages/NotFoundPage';
import { useSetSideContent } from '../../../context/SideContentContext';
import { GooglePartnerWidget } from '../../../components/widgets/GooglePartnerWidget';
import { AirtelGabonWidget } from '../../../components/widgets/AirtelGabonWidget';

export interface NewsDetailContentProps {
  slug: string;
  /** Remplace l'ancienne navigation "Retour aux news" (route dédiée) :
   * ce contenu n'est plus une page, donc "retour" == fermer le panneau. */
  onClose: () => void;
}

/**
 * Contenu intégral de l'ancienne page /news/:slug (et /sujets/:slug) --
 * déplacé tel quel depuis pages/NewsDetailPage.tsx (route désormais
 * débranchée dans App.tsx) pour être affiché dans le BottomSheet
 * générique plutôt que sur une page complète. `slug` arrive en prop
 * (plus de useParams, il n'y a plus de route) ; toute la logique de
 * récupération/affichage des données reste identique.
 */
export function NewsDetailContent({ slug, onClose }: NewsDetailContentProps) {
  const { newsItem, setNewsItem, sujet, setSujet, isLoading, error } = useNews(slug);
  const currentItem = newsItem || sujet;
  const setCurrentItem = setNewsItem || setSujet;
  const { newsList, sujets: allSujets } = useNewsList();

  const commentsRef = useRef<HTMLDivElement>(null);
  const pollsRef = useRef<HTMLDivElement>(null);

  // Set side content dynamically according to the current news
  useSetSideContent(
    currentItem ? (
      <div className="space-y-4">
        {/* News Metadata Widget */}
        <div className="bg-white dark:bg-[#1A1F4D] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
            <Info className="w-4 h-4 text-[#5B4DFF]" />
            <h4 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
              Cadre Institutionnel
            </h4>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <Building className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-gray-400 block font-semibold uppercase">Initiateur :</span>
                <span className="font-extrabold text-gray-900 dark:text-white">
                  {currentItem.auteur.nomAffiche}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-gray-400 block font-semibold uppercase">Lancement :</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {new Date(currentItem.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
              <ShieldCheck className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                Information officielle enregistrée et traçable sur registre certifié CIVITAS.
              </span>
            </div>
          </div>
        </div>

        <GooglePartnerWidget />
        <AirtelGabonWidget />
      </div>
    ) : null,
    [currentItem?.id]
  );

  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPolls = () => {
    pollsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="space-y-3 max-w-5xl mx-auto py-2 px-1">
        <Skeleton height={220} variant="card" />
        <Skeleton height={40} variant="rectangular" />
        <Skeleton height={150} variant="rectangular" />
      </div>
    );
  }

  if (error || !currentItem) {
    return <NotFoundPage />;
  }

  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-3 sm:space-y-4 px-1 sm:px-2">
      {/* Close (remplace l'ancien lien "Retour aux news", qui naviguait
          vers une page dédiée -- ici on ferme simplement le panneau) */}
      <button
        onClick={onClose}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#00785a] transition-colors py-0.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Fermer</span>
      </button>

      {/* SharePoint Style Header Banner */}
      <NewsHeaderSharePointStyle
        news={currentItem}
        sujet={currentItem}
        onUpdate={setCurrentItem}
        onScrollToComments={scrollToComments}
        onScrollToPolls={scrollToPolls}
      />

      {/* Main Content */}
      <NewsContenu news={currentItem} sujet={currentItem} />

      {/* Bento Media Gallery */}
      <NewsMediaGallery
        medias={currentItem.medias}
        newsTitre={currentItem.titre}
        sujetTitre={currentItem.titre}
        defaultImage={currentItem.image}
      />

      {/* Active Polls section */}
      {currentItem.sondages && currentItem.sondages.length > 0 && (
        <div ref={pollsRef} className="space-y-3 pt-1">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white font-display">
            Sondages associés ({currentItem.sondages.length})
          </h2>
          {currentItem.sondages.map((sondage) => (
            <SondageCard
              key={sondage.id}
              sondage={sondage}
              onUpdate={(updatedSondage) => {
                setCurrentItem({
                  ...currentItem,
                  sondages: currentItem.sondages.map((s) => (s.id === updatedSondage.id ? updatedSondage : s)),
                });
              }}
            />
          ))}
        </div>
      )}

      {/* Attached Documents */}
      <NewsDocuments documents={currentItem.documents} />

      {/* WhatsApp style Discussion Thread */}
      <div ref={commentsRef}>
        <CommentThread sujetId={currentItem.id} newsId={currentItem.id} />
      </div>

      {/* Related News */}
      <NewsSimilaires currentNewsId={currentItem.id} currentSujetId={currentItem.id} allNews={newsList || allSujets} allSujets={newsList || allSujets} />
    </div>
  );
}
