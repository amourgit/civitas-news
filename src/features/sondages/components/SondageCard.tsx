import React, { useEffect, useState } from 'react';
import { Sondage } from '../../../types/global.types';
import { useVote } from '../hooks/useVote';
import { VoteBarAnimee } from './VoteBarAnimee';
import { Button } from '../../../components/ui/Button';
import { Clock, Shield, CheckSquare, BarChart2, Pencil, X } from 'lucide-react';
import { formatTimeLeft, formatDateRelative } from '../../../lib/formatDate';
import { formatNumber } from '../../../lib/formatNumber';

export interface SondageCardProps {
  sondage: Sondage;
  onUpdate?: (updated: Sondage) => void;
}

export const SondageCard: React.FC<SondageCardProps> = ({ sondage, onUpdate }) => {
  // Copie locale : un vote/retrait doit rester visible immédiatement même
  // quand le parent ne fait pas suivre `onUpdate` (ex: SondageFocusPage) --
  // resynchronisée seulement si on change réellement de sondage (id),
  // jamais écrasée par un simple re-render du parent avec la même prop.
  const [currentSondage, setCurrentSondage] = useState<Sondage>(sondage);
  useEffect(() => {
    setCurrentSondage(sondage);
  }, [sondage.id]);

  const hasVoted = (currentSondage.userVotedChoiceIds?.length ?? 0) > 0;
  const [isEditing, setIsEditing] = useState(false);
  const [selectedChoices, setSelectedChoices] = useState<string[]>(currentSondage.userVotedChoiceIds || []);
  const enSelection = !hasVoted || isEditing;
  const estOuvert = currentSondage.statut === 'actif' && new Date(currentSondage.dateFin).getTime() > Date.now();

  const handleVoteUpdate = (updated: Sondage) => {
    setCurrentSondage(updated);
    setSelectedChoices(updated.userVotedChoiceIds || []);
    setIsEditing(false);
    if (onUpdate) onUpdate(updated);
  };

  const { vote, retirerVote, isSubmitting } = useVote(currentSondage.id, handleVoteUpdate);

  const handleToggleChoice = (choiceId: string) => {
    if (!enSelection) return;
    if (currentSondage.typeVote === 'multiple') {
      setSelectedChoices((prev) =>
        prev.includes(choiceId) ? prev.filter((id) => id !== choiceId) : [...prev, choiceId]
      );
    } else {
      setSelectedChoices([choiceId]);
    }
  };

  const handleVoteSubmit = () => vote(selectedChoices);

  const handleStartEdit = () => {
    setSelectedChoices(currentSondage.userVotedChoiceIds || []);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setSelectedChoices(currentSondage.userVotedChoiceIds || []);
    setIsEditing(false);
  };

  // Fait foi côté serveur (voir sondages/api/v1/serializers.py:
  // SondageSerializer._resultats_visibles) ; repli sur l'ancienne
  // heuristique client si absent (mode mock, réponse mise en cache).
  const showResults =
    currentSondage.resultatsVisibles ?? (hasVoted || currentSondage.visibiliteResultat === 'instantane');

  return (
    <div className="bg-white dark:bg-[#1A1F4D] rounded-none p-1.5 sm:p-2.5 border border-gray-100 dark:border-gray-800 shadow-sm mb-3">
      {/* Header Badge & Title */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none bg-[#5B4DFF]/10 text-[#5B4DFF] dark:text-[#7B61FF] text-[11px] font-extrabold">
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Sondage Officiel ({currentSondage.typeVote === 'multiple' ? 'Choix Multiple' : 'Choix Unique'})</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            {formatTimeLeft(currentSondage.dateFin)}
          </span>
          {currentSondage.anonymat && (
            <span
              className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold"
              title="Anonymat garanti"
            >
              <Shield className="w-3.5 h-3.5" />
              Vote Anonyme
            </span>
          )}
        </div>
      </div>

      <h3 className="text-xl font-extrabold text-gray-900 dark:text-white font-display mb-1">
        {currentSondage.question}
      </h3>
      {currentSondage.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{currentSondage.description}</p>
      )}
      {currentSondage.auteur && currentSondage.createdAt && (
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-4">
          Créé par {currentSondage.auteur.nomAffiche} · {formatDateRelative(currentSondage.createdAt)}
        </p>
      )}

      {/* Options List */}
      <div className="space-y-3 mb-6">
        {currentSondage.choix.map((c) => (
          <VoteBarAnimee
            key={c.id}
            choix={c}
            isSelected={selectedChoices.includes(c.id)}
            onSelect={() => handleToggleChoice(c.id)}
            showResults={showResults}
            disabled={!enSelection || !estOuvert}
            typeVote={currentSondage.typeVote}
          />
        ))}
      </div>

      {/* Action CTA & Vote stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          <BarChart2 className="w-4 h-4 text-[#5B4DFF]" />
          <span>{formatNumber(currentSondage.totalVotes)} participant(s)</span>
        </div>

        {!estOuvert ? (
          <span className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold">
            Sondage clôturé
          </span>
        ) : enSelection ? (
          <div className="flex items-center gap-2">
            {isEditing && (
              <Button variant="ghost" size="md" onClick={handleCancelEdit} disabled={isSubmitting}>
                Annuler
              </Button>
            )}
            <Button
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              disabled={!selectedChoices.length}
              onClick={handleVoteSubmit}
            >
              Confirmer mon vote
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              ✓ Votre vote a été comptabilisé
            </span>
            <Button
              variant="outline"
              size="sm"
              icon={<Pencil className="w-3.5 h-3.5" />}
              onClick={handleStartEdit}
              disabled={isSubmitting}
            >
              Modifier
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<X className="w-3.5 h-3.5" />}
              onClick={() => retirerVote()}
              disabled={isSubmitting}
            >
              Retirer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
