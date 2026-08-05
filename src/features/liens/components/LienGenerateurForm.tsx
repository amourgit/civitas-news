import React, { useState } from 'react';
import { liensService } from '../../../services/api/liens.service';
import { LienPublication } from '../../../types/global.types';
import { Button } from '../../../components/ui/Button';
import { LienQrCode } from './LienQrCode';
import { Link2, Shield, Calendar, Lock } from 'lucide-react';
import { toast } from '../../../hooks/useToast';

export interface LienGenerateurFormProps {
  sujetId: string;
}

export const LienGenerateurForm: React.FC<LienGenerateurFormProps> = ({ sujetId }) => {
  const [visibilite, setVisibilite] = useState<'public' | 'prive' | 'limite'>('public');
  const [hasPassword, setHasPassword] = useState(false);
  const [expiration, setExpiration] = useState('');
  const [province, setProvince] = useState('');
  const [generatedLien, setGeneratedLien] = useState<LienPublication | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await liensService.genererLien(sujetId, {
        visibilite,
        motDePasse: hasPassword,
        expiration,
        scope: province ? { province } : undefined,
      });
      setGeneratedLien(result);
      toast('success', 'Lien & QR Code générés !');
    } catch (err: any) {
      toast('error', 'Erreur de génération');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1A1F4D] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display flex items-center gap-2">
        <Link2 className="w-5 h-5 text-[#5B4DFF]" />
        Générateur de Lien & QR Code Contrôlé
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
        <div>
          <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
            Visibilité du lien
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'public', label: 'Public' },
              { id: 'limite', label: 'Restreint (Scope)' },
              { id: 'prive', label: 'Privé (Lien Direct)' },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVisibilite(v.id as any)}
                className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all ${
                  visibilite === v.id
                    ? 'bg-[#5B4DFF] text-white border-[#5B4DFF]'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {visibilite === 'limite' && (
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
              Restreindre à la province :
            </label>
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <option value="">Toutes les provinces</option>
              <option value="Kinshasa">Kinshasa</option>
              <option value="Haut-Katanga">Haut-Katanga</option>
              <option value="Nord-Kivu">Nord-Kivu</option>
            </select>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="pwdCheck"
            checked={hasPassword}
            onChange={(e) => setHasPassword(e.target.checked)}
            className="w-4 h-4 rounded text-[#5B4DFF]"
          />
          <label htmlFor="pwdCheck" className="font-semibold text-gray-700 dark:text-gray-300">
            Protéger l’accès par mot de passe
          </label>
        </div>

        <Button type="submit" variant="primary" size="md" isLoading={isLoading} className="w-full">
          Générer Lien & QR Code
        </Button>
      </form>

      {generatedLien && (
        <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
          <LienQrCode url={generatedLien.urlCourte || generatedLien.urlPublique} />
        </div>
      )}
    </div>
  );
};
