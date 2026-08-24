import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from '../../features/statistiques/components/StatCard';
import { AdminDataTable, type Column } from '../../features/administration/components/AdminDataTable';
import { FileText, CheckSquare, MessageSquare, ShieldAlert, Users, ArrowRight } from 'lucide-react';
import { statistiquesService } from '../../services/api/statistiques.service';
import { adminService } from '../../services/api/admin.service';
import { newsService } from '../../services/api/news.service';
import { formatDateRelative } from '../../lib/formatDate';
import type { AuditLog } from '../../types/global.types';
import { groupModelsByApp } from '../../components/backoffice/registry';
import { usePermissions } from '../../lib/permissions/usePermissions';
import { PERMISSIONS } from '../../lib/permissions/permissions.catalog';

interface DashboardCounts {
  newsValidees: number;
  sondagesActifs: number;
  signalementsEnAttente: number;
  citoyensInscrits: number;
}

export default function AdminDashboardPage() {
  const { can } = usePermissions();
  const [counts, setCounts] = useState<DashboardCounts | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [globales, signalements, logs, news] = await Promise.all([
          statistiquesService.getStatistiquesGlobales(),
          adminService.getSignalements(),
          adminService.getAuditLogs(),
          newsService.getNews(),
        ]);

        if (cancelled) return;

        setCounts({
          newsValidees: globales.totalNewsActives,
          sondagesActifs: news.reduce((total, item) => total + (item.sondages?.length || 0), 0),
          signalementsEnAttente: signalements.filter((s) => s.statut === 'en_attente').length,
          citoyensInscrits: globales.totalCitoyensInscrits ?? globales.totalVisiteurs,
        });
        setAuditLogs(logs);
      } catch (error) {
        console.error('Échec du chargement du tableau de bord administrateur:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const auditColumns: Column<AuditLog>[] = [
    { key: 'action', header: 'Action' },
    { key: 'utilisateur', header: 'Utilisateur' },
    { key: 'cible', header: 'Cible' },
    {
      key: 'horodatage',
      header: 'Quand',
      render: (item) => formatDateRelative(item.horodatage),
    },
    { key: 'adresseIp', header: 'Adresse IP' },
  ];

  const groups = groupModelsByApp()
    .map((group) => ({
      ...group,
      models: group.models.filter((m) => can(m.viewPermission ?? PERMISSIONS.BACKOFFICE_ACCESS)),
    }))
    .filter((group) => group.models.length > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white font-display">
        Tableau de Bord Administrateur
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="News Validées" value={counts?.newsValidees ?? 0} icon={<FileText className="w-5 h-5" />} />
        <StatCard title="Sondages Actifs" value={counts?.sondagesActifs ?? 0} icon={<CheckSquare className="w-5 h-5" />} />
        <StatCard
          title="Signalements En Attente"
          value={counts?.signalementsEnAttente ?? 0}
          icon={<ShieldAlert className="w-5 h-5 text-red-500" />}
        />
        <StatCard title="Citoyens & Inscrits" value={counts?.citoyensInscrits ?? 0} icon={<Users className="w-5 h-5" />} />
      </div>

      {/* Accès rapide — toutes les tables du backoffice, groupées par
          app, générées depuis le même registre que la navbar (voir
          src/components/backoffice/registry/). */}
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.appLabel}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
              {group.appLabel}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.models.map((model) => {
                const Icon = model.icon;
                return (
                  <Link
                    key={model.key}
                    to={`/admin/${model.key}`}
                    className="group flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-[#1A1F4D] border border-gray-100 dark:border-gray-800 hover:border-[#5B4DFF]/40 hover:shadow-md transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#5B4DFF]/10 text-[#5B4DFF] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{model.labelPlural}</p>
                      {model.description && (
                        <p className="text-xs text-gray-400 truncate">{model.description}</p>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#5B4DFF] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!isLoading && auditLogs.length === 0 ? (
        <div className="bg-white dark:bg-[#1A1F4D] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 space-y-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display">
            Journal des dernières activités de modération
          </h3>
          <p className="text-xs text-gray-400 flex items-center gap-1.5 pt-1">
            <MessageSquare className="w-3.5 h-3.5" /> Aucune activité récente à afficher.
          </p>
        </div>
      ) : (
        <AdminDataTable<AuditLog>
          title="Journal des dernières activités de modération"
          description="Supervision en direct de la modération et de l'intégrité des votes."
          columns={auditColumns}
          data={auditLogs}
          searchPlaceholder="Rechercher une activité..."
        />
      )}
    </div>
  );
}
