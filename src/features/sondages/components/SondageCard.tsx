import React, { useState } from 'react';
import { Sondage } from '../../../types/global.types';
import { useVote } from '../hooks/useVote';
import { VoteBarAnimee } from './VoteBarAnimee';
import { Button } from '../../../components/ui/Button';
import { Clock, Shield, CheckSquare, BarChart2 } from 'lucide-react';
import { formatTimeLeft } from '../../../lib/formatDate';
import { formatNumber } from '../../../lib/formatNumber';

export interface SondageCardProps {
  sondage: Sondage;
  onUpdate?: (updated: Sondage) => void;
}

export const SondageCard: React.FC<SondageCardProps> = ({ sondage, onUpdate }) => {
  const [selectedChoices, setSelectedChoices] = useState<string[]>(sondage.userVotedChoiceIds || []);
  const [hasVoted, setHasVoted] = useState<boolean>(!!sondage.userVotedChoiceIds?.length);
  const { vote, isSubmitting } = useVote(sondage.id, (updated) => {
    setHasVoted(true);
    if (onUpdate) onUpdate(updated);
  });

  const handleToggleChoice = (choiceId: string) => {
    if (hasVoted) return;
    if (sondage.typeVote === 'multiple') {
      setSelectedChoices((prev) =>
        prev.includes(choiceId) ? prev.filter((id) => id !== choiceId) : [...prev, choiceId]
      );
    } else {
      setSelectedChoices([choiceId]);
    }
  };

  const handleVoteSubmit = () => {
    vote(selectedChoices);
  };

  return (
    <div className="bg-white dark:bg-[#1A1F4D] rounded-none p-1.5 sm:p-2.5 border border-gray-100 dark:border-gray-800 shadow-sm mb-3">
      {/* Header Badge & Title */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none bg-[#5B4DFF]/10 text-[#5B4DFF] dark:text-[#7B61FF] text-[11px] font-extrabold">
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Sondage Officiel ({sondage.typeVote === 'multiple' ? 'Choix Multiple' : 'Choix Unique'})</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            {formatTimeLeft(sondage.dateFin)}
          </span>
          {sondage.anonymat && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold" title="Anonymat garanti">
              <Shield className="w-3.5 h-3.5" />
              Vote Anonyme
            </span>
          )}
        </div>
      </div>

      <h3 className="text-xl font-extrabold text-gray-900 dark:text-white font-display mb-2">
        {sondage.question}
      </h3>
      {sondage.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">{sondage.description}</p>
      )}

      {/* Options List */}
      <div className="space-y-3 mb-6">
        {sondage.choix.map((c) => (
          <VoteBarAnimee
            key={c.id}
            choix={c}
            isSelected={selectedChoices.includes(c.id)}
            onSelect={() => handleToggleChoice(c.id)}
            showResults={hasVoted || sondage.visibiliteResultat === 'instantane'}
            disabled={hasVoted}
            typeVote={sondage.typeVote}
          />
        ))}
      </div>

      {/* Action CTA & Vote stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          <BarChart2 className="w-4 h-4 text-[#5B4DFF]" />
          <span>{formatNumber(sondage.totalVotes)} participant(s)</span>
        </div>

        {!hasVoted ? (
          <Button
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            disabled={!selectedChoices.length}
            onClick={handleVoteSubmit}
          >
            Confirmer mon vote
          </Button>
        ) : (
          <span className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            ✓ Votre vote a été comptabilisé
          </span>
        )}
      </div>
    </div>
  );
};
