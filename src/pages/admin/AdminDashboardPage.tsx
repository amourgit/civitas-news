import React from 'react';
import { AdminSidebar } from '../../features/administration/components/AdminSidebar';
import { StatCard } from '../../features/statistiques/components/StatCard';
import { FileText, CheckSquare, MessageSquare, ShieldAlert, Users } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0E1338]">
      <AdminSidebar />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white font-display">
          Tableau de Bord Administrateur
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="News Validées" value={14} icon={<FileText className="w-5 h-5" />} />
          <StatCard title="Sondages Actifs" value={8} icon={<CheckSquare className="w-5 h-5" />} />
          <StatCard title="Signalements En Attente" value={3} icon={<ShieldAlert className="w-5 h-5 text-red-500" />} />
          <StatCard title="Citoyens & Inscrits" value={18200} icon={<Users className="w-5 h-5" />} />
        </div>

        <div className="bg-white dark:bg-[#1A1F4D] rounded-3xl p-6 border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display mb-2">
            Journal des dernières activités de modération
          </h3>
          <p className="text-xs text-gray-500">Supervision en direct de la modération et de l'intégrité des votes.</p>
        </div>
      </main>
    </div>
  );
}
