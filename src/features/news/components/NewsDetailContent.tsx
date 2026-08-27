import React, { useRef } from 'react';
import { News } from '../../../types/global.types';
import { NewsHeaderSharePointStyle } from './NewsHeaderSharePointStyle';
import { NewsContenu } from './NewsContenu';
import { NewsMediaGallery } from './NewsMediaGallery';
import { NewsDocuments } from './NewsDocuments';
import { NewsSimilaires } from './NewsSimilaires';
import { SondageCard } from '../../sondages/components/SondageCard';
import { CommentThread } from '../../discussion/components/CommentThread';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Building, Calendar, Info, ShieldCheck } from 'lucide-react';
import { useSetSideContent } from '../../../context/SideContentContext';
import { GooglePartnerWidget } from '../../../components/widgets/GooglePartnerWidget';
import { AirtelGabonWidget } from '../../../components/widgets/AirtelGabonWidget';

export interface NewsDetailContentProps {
  newsItem: News;
  onUpdate?: (updated: News) => void;
  allNews?: News[];
  allSujets?: News[];
  onOpenDetail?: (slug: string) => void;
}

export const NewsDetailContent: React.FC<NewsDetailContentProps> = ({
  newsItem,
  onUpdate,
  allNews = [],
  allSujets = [],
  onOpenDetail,
}) => {
  const setCurrentItem = onUpdate;
  const commentsRef = useRef<HTMLDivElement>(null);
  const pollsRef = useRef<HTMLDivElement>(null);

  // Set side content dynamically according to the current news
  useSetSideContent(
    newsItem ? (
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
                  {newsItem.auteur.nomAffiche}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-gray-400 block font-semibold uppercase">Lancement :</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {new Date(newsItem.createdAt).toLocaleDateString('fr-FR', {
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
    [newsItem?.id]
  );

  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPolls = () => {
    pollsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-3 sm:space-y-4 px-1 sm:px-2">
      {/* SharePoint Style Header Banner */}
      <NewsHeaderSharePointStyle
        news={newsItem}
        sujet={newsItem}
        onUpdate={setCurrentItem}
        onScrollToComments={scrollToComments}
        onScrollToPolls={scrollToPolls}
      />

      {/* Main Content */}
      <NewsContenu news={newsItem} sujet={newsItem} />

      {/* Bento Media Gallery */}
      <NewsMediaGallery
        medias={newsItem.medias}
        newsTitre={newsItem.titre}
        sujetTitre={newsItem.titre}
        defaultImage={newsItem.image}
      />

      {/* Active Polls section */}
      {newsItem.sondages && newsItem.sondages.length > 0 && (
        <div ref={pollsRef} className="space-y-3 pt-1">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white font-display">
            Sondages associés ({newsItem.sondages.length})
          </h2>
          {newsItem.sondages.map((sondage) => (
            <SondageCard
              key={sondage.id}
              sondage={sondage}
              onUpdate={(updatedSondage) => {
                setCurrentItem?.({
                  ...newsItem,
                  sondages: newsItem.sondages.map((s) => (s.id === updatedSondage.id ? updatedSondage : s)),
                });
              }}
            />
          ))}
        </div>
      )}

      {/* Attached Documents */}
      <NewsDocuments documents={newsItem.documents} />

      {/* WhatsApp style Discussion Thread */}
      <div ref={commentsRef}>
        <CommentThread sujetId={newsItem.id} newsId={newsItem.id} />
      </div>

      {/* Related News */}
      <NewsSimilaires currentNewsId={newsItem.id} currentSujetId={newsItem.id} allNews={allNews || allSujets} allSujets={allNews || allSujets} onOpenDetail={onOpenDetail} />
    </div>
  );
};
