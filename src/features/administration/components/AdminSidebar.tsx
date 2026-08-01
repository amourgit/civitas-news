import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FileText,
  CheckSquare,
  MessageSquare,
  Users,
  Building,
  GraduationCap,
  Map,
  Tag,
  ShieldAlert,
  Download,
  Key,
  Settings,
  Activity,
} from 'lucide-react';

const ADMIN_GROUPS = [
  {
    title: 'Contenu',
    items: [
      { to: '/admin/sujets', label: 'Sujets', icon: <FileText className="w-4 h-4" /> },
      { to: '/admin/sondages', label: 'Sondages', icon: <CheckSquare className="w-4 h-4" /> },
      { to: '/admin/commentaires', label: 'Commentaires', icon: <MessageSquare className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Organisation',
    items: [
      { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: <Users className="w-4 h-4" /> },
      { to: '/admin/organisations', label: 'Organisations', icon: <Building className="w-4 h-4" /> },
      { to: '/admin/etablissements', label: 'Établissements', icon: <GraduationCap className="w-4 h-4" /> },
      { to: '/admin/provinces', label: 'Provinces', icon: <Map className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Modération & Modèles',
    items: [
      { to: '/admin/signalements', label: 'Signalements', icon: <ShieldAlert className="w-4 h-4 text-red-500" /> },
      { to: '/admin/categories', label: 'Catégories', icon: <Tag className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Système',
    items: [
      { to: '/admin/audit', label: 'Audit & Logs', icon: <Activity className="w-4 h-4" /> },
      { to: '/admin/roles', label: 'Rôles & Droits', icon: <Key className="w-4 h-4" /> },
      { to: '/admin/parametres', label: 'Paramètres', icon: <Settings className="w-4 h-4" /> },
    ],
  },
];

export const AdminSidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 min-h-screen p-4 flex flex-col justify-between border-r border-gray-200 dark:border-gray-800 shrink-0 hidden md:flex">
      <div className="space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="w-8 h-8 rounded-xl bg-[#5B4DFF] text-white flex items-center justify-center font-bold">
            A
          </div>
          <div>
            <div className="font-extrabold text-gray-900 dark:text-white text-sm">CIVITAS Admin</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">Backoffice de Gestion</div>
          </div>
        </div>

        {/* Groups */}
        <div className="space-y-5">
          {ADMIN_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 mb-2">
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-[#5B4DFF] text-white font-bold shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/60'
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
