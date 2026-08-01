import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNews } from '../features/news/hooks/useNews';
import { SondageCard } from '../features/sondages/components/SondageCard';
import { SondageEvolutionChart } from '../features/sondages/components/SondageEvolutionChart';
import { ArrowLeft, CheckSquare } from 'lucide-react';
import NotFoundPage from './NotFoundPage';

export default function SondageFocusPage() {
  const { slug, sondageId } = useParams<{ slug: string; sondageId: string }>();
  const { newsItem, sujet, isLoading } = useNews(slug);
  const currentItem = newsItem || sujet;

  if (isLoading) return <div className="p-8 text-center text-xs text-gray-400">Chargement...</div>;

  const sondage = currentItem?.sondages?.find((s) => s.id === sondageId) || currentItem?.sondages?.[0];

  if (!currentItem || !sondage) return <NotFoundPage />;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      <Link
        to={`/news/${currentItem.slug}`}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#5B4DFF]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour à la news "{currentItem.titre}"</span>
      </Link>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white font-display flex items-center gap-3">
          <CheckSquare className="w-7 h-7 text-[#5B4DFF]" />
          Focus Sondage : {sondage.titre}
        </h1>
        <p className="text-xs text-gray-500">
          Consultez et analysez les choix de réponses et l’évolution de la participation.
        </p>
      </div>

      <SondageCard sondage={sondage} />
      <SondageEvolutionChart />
    </div>
  );
}

