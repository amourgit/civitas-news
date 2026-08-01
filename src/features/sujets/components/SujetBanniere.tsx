import React from 'react';
import { Sujet } from '../../../types/global.types';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { MapPin, Calendar, Clock, Building2 } from 'lucide-react';
import { formatDateFull } from '../../../lib/formatDate';

export interface SujetBanniereProps {
  sujet: Sujet;
}

export const SujetBanniere: React.FC<SujetBanniereProps> = ({ sujet }) => {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-slate-950 text-white mb-8 shadow-2xl">
      {/* Background Image */}
      <img
        src={sujet.image}
        alt={sujet.titre}
        className="w-full h-80 sm:h-96 object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

      {/* Banner Content */}
      <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <Badge variant="type" type={sujet.type} size="md">
            {sujet.type.toUpperCase()}
          </Badge>
          <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-semibold border border-white/20">
            {sujet.categorie.nom}
          </span>
          {sujet.province && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-400/30">
              <MapPin className="w-3.5 h-3.5" />
              {sujet.province}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-display mb-4 leading-tight">
          {sujet.titre}
        </h1>

        {/* Metadata Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs text-gray-300">
          <div className="flex items-center gap-3">
            <Avatar src={sujet.auteur.avatar} name={sujet.auteur.nomAffiche} size="lg" />
            <div>
              <div className="font-bold text-white text-sm flex items-center gap-2">
                {sujet.auteur.nomAffiche}
                {sujet.organisation && (
                  <span className="text-gray-400 text-xs font-normal flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-[#7B61FF]" />
                    {sujet.organisation.nom}
                  </span>
                )}
              </div>
              <div className="text-gray-400 text-xs">{sujet.etablissement?.nom || 'Plateforme Nationale'}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-gray-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#7B61FF]" />
              Publié le {formatDateFull(sujet.createdAt)}
            </span>
            {sujet.dateFin && (
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <Clock className="w-4 h-4" />
                Clôture le {formatDateFull(sujet.dateFin)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
