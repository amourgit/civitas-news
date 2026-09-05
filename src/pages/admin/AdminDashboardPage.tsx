// ============================================================
// src/pages/admin/AdminDashboardPage.tsx
// Refonte complète (voir maquette e-commerce fournie par l'utilisateur) --
// même esprit (cartes stats + grands graphiques + table "publications
// récentes"), mais entièrement branchée sur des données réelles du
// backend CIVITAS (statistiquesService/adminService/newsService), pas
// sur un jeu de données e-commerce. Le raccourci "Accès rapide" par
// modèle disparaît : la sidebar persistante (AdminSidebar.tsx) couvre
// désormais ce rôle.
// ============================================================

import React, { useEffect, useMemo, useState } from 'react';
import { statistiquesService } from '../../services/api/statistiques.service';
import { adminService } from '../../services/api/admin.service';
import { newsService } from '../../services/api/news.service';
import { toast } from '../../hooks/useToast';
import type { StatistiquesGlobales, Signalement, Utilisateur, News } from '../../types/global.types';
import { DonutStatCard } from '../../features/dashboards/admin/DonutStatCard';
import { BarMiniStatCard } from '../../features/dashboards/admin/BarMiniStatCard';
import { ProgressStatCard } from '../../features/dashboards/admin/ProgressStatCard';
import { HeroesStatCard } from '../../features/dashboards/admin/HeroesStatCard';
import { AreaMetricPanel } from '../../features/dashboards/admin/AreaMetricPanel';
import { RecentContentPanel } from '../../features/dashboards/admin/RecentContentPanel';

export default function AdminDashboardPage() {
  const [globales, setGlobales] = useState<StatistiquesGlobales | null>(null);
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [newsList, setNewsList] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [g, s, u, n] = await Promise.all([
          statistiquesService.getStatistiquesGlobales(),
          adminService.getSignalements(),
          adminService.getUtilisateurs(),
          newsService.getNews(),
        ]);
        if (cancelled) return;
        setGlobales(g);
        setSignalements(s);
        setUtilisateurs(u);
        setNewsList(n);
      } catch (error) {
        console.error('Échec du chargement du tableau de bord administrateur:', error);
        if (!cancelled) toast('error', 'Tableau de bord indisponible', 'Impossible de charger les statistiques. Réessayez dans un instant.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const donutSegments = useMemo(
    () => (globales?.repartitionParCategorie ?? []).map((c) => ({ label: c.category, value: c.count })),
    [globales]
  );

  const barData = useMemo(
    () => (globales?.activiteParHeure ?? []).slice(-7).map((h) => ({ label: h.heure, value: h.votes })),
    [globales]
  );

  const signalementsTraites = useMemo(() => signalements.filter((s) => s.statut === 'traite').length, [signalements]);
  const signalementsEnAttente = useMemo(() => signalements.filter((s) => s.statut === 'en_attente').length, [signalements]);

  const topContributeurs = useMemo(
    () => [...utilisateurs].sort((a, b) => (b.stats?.contributions ?? 0) - (a.stats?.contributions ?? 0)),
    [utilisateurs]
  );

  const evolutionData = useMemo(
    () => (globales?.evolutionMensuelle ?? []).map((m) => ({ label: m.mois, value: m.participation })),
    [globales]
  );
  const derniereParticipation = evolutionData.length > 0 ? evolutionData[evolutionData.length - 1].value : 0;

  const activiteHoraireData = useMemo(
    () => (globales?.activiteParHeure ?? []).map((h) => ({ label: h.heure, value: h.votes + h.commentaires })),
    [globales]
  );
  const totalActiviteHoraire = activiteHoraireData.reduce((sum, d) => sum + d.value, 0);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-7 w-64 bg-gray-200/70 dark:bg-white/10 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200/70 dark:bg-white/10 rounded-3xl" />
            ))}
          </div>
          <div className="lg:col-span-4 h-full min-h-[280px] bg-gray-200/70 dark:bg-white/10 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white font-display">Tableau de Bord</h1>
        <p className="text-sm text-gray-400">Vue d'ensemble en temps réel de l'activité de la plateforme CIVITAS.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DonutStatCard title="Publications actives" value={globales?.totalNewsActives ?? 0} variation={globales?.croissanceMensuelle} segments={donutSegments} />
          <BarMiniStatCard title="Votes exprimés" value={globales?.totalVotes ?? 0} bars={barData} />
          <ProgressStatCard title="Signalements en attente" value={signalementsEnAttente} total={signalements.length} progressLabel={`${signalementsTraites} traités sur ${signalements.length}`} />
          <HeroesStatCard
            title="Citoyens inscrits"
            value={globales?.totalCitoyensInscrits ?? globales?.totalVisiteurs ?? 0}
            heroesLabel="Contributeurs les plus actifs"
            topContributeurs={topContributeurs}
            totalCount={utilisateurs.length}
          />
        </div>
        <div className="lg:col-span-4">
          <AreaMetricPanel
            title="Évolution de la participation"
            subtitle="Publications par mois"
            value={derniereParticipation}
            variation={globales?.croissanceMensuelle}
            data={evolutionData}
            gradientId="admin-evolution"
            height={260}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <RecentContentPanel news={newsList} />
        </div>
        <div className="lg:col-span-4">
          <AreaMetricPanel
            title="Activité par heure"
            subtitle="Votes + commentaires, sur 24h"
            value={totalActiviteHoraire}
            data={activiteHoraireData}
            color="#22D3EE"
            gradientId="admin-activite-horaire"
          />
        </div>
      </div>
    </div>
  );
}
