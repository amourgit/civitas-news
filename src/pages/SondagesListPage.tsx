import React, { useMemo, useState } from 'react';
import { CheckSquare } from 'lucide-react';
import { useSondagesList } from '../features/sondages/hooks/useSondagesList';
import { SondageCard } from '../features/sondages/components/SondageCard';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Tabs, type TabItem } from '../components/ui/Tabs';

type FiltreStatut = 'actifs' | 'termines' | 'tous';

// Page dédiée aux sondages existants sur la plateforme (route /sondages).
// Remplace l'ancien renvoi vers /news?type=sondage : ici on affiche
// directement les sondages eux-mêmes (SondageCard, avec vote inclus),
// pas une liste de News générique filtrée.
export default function SondagesListPage() {
  const { sondages, isLoading, onUpdateSondage } = useSondagesList();
  const [filtre, setFiltre] = useState<FiltreStatut>('actifs');

  const sondagesFiltres = useMemo(() => {
    if (filtre === 'tous') return sondages;
    if (filtre === 'actifs') return sondages.filter((s) => s.statut === 'actif' || s.statut === 'programme');
    return sondages.filter((s) => s.statut === 'termine' || s.statut === 'archive');
  }, [sondages, filtre]);

  const tabs: TabItem[] = [
    { id: 'actifs', label: 'Actifs', count: sondages.filter((s) => s.statut === 'actif' || s.statut === 'programme').length },
    { id: 'termines', label: 'Terminés', count: sondages.filter((s) => s.statut === 'termine' || s.statut === 'archive').length },
    { id: 'tous', label: 'Tous', count: sondages.length },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-16">
      <div className="space-y-2">
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white font-display flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-2xl bg-[#5B4DFF]/10 text-[#5B4DFF] flex items-center justify-center shrink-0">
            <CheckSquare className="w-5 h-5" />
          </span>
          Sondages
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Donnez votre avis sur les sondages en cours et consultez les résultats de la communauté.
        </p>
      </div>

      <Tabs tabs={tabs} activeTab={filtre} onChange={(id) => setFiltre(id as FiltreStatut)} variant="chips" />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={260} variant="card" />
          ))}
        </div>
      ) : sondagesFiltres.length ? (
        <div className="space-y-3">
          {sondagesFiltres.map((sondage) => (
            <SondageCard key={sondage.id} sondage={sondage} onUpdate={onUpdateSondage} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CheckSquare className="w-8 h-8" />}
          title="Aucun sondage"
          description={
            filtre === 'tous'
              ? "Aucun sondage n'existe encore sur la plateforme."
              : "Aucun sondage ne correspond à ce filtre pour l'instant."
          }
        />
      )}
    </div>
  );
}
