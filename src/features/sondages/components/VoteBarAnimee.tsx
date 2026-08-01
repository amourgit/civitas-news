import React from 'react';
import { ChoixSondage } from '../../../types/global.types';
import { CheckCircle2 } from 'lucide-react';

export interface VoteBarAnimeeProps {
  choix: ChoixSondage;
  isSelected?: boolean;
  onSelect?: () => void;
  showResults?: boolean;
  disabled?: boolean;
  typeVote?: 'unique' | 'multiple';
}

export const VoteBarAnimee: React.FC<VoteBarAnimeeProps> = ({
  choix,
  isSelected = false,
  onSelect,
  showResults = false,
  disabled = false,
  typeVote = 'unique',
}) => {
  return (
    <div
      onClick={() => !disabled && onSelect && onSelect()}
      className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-300 border ${
        isSelected
          ? 'bg-purple-50 dark:bg-purple-950/40 border-[#5B4DFF] shadow-md'
          : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700/60 hover:border-gray-300'
      } ${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-[1.01]'}`}
    >
      {/* Animated result fill bar */}
      {showResults && (
        <div
          className="absolute inset-y-0 left-0 bg-[#5B4DFF]/15 dark:bg-[#5B4DFF]/30 transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, choix.pourcentage)}%` }}
        />
      )}

      {/* Choice label and selector icon */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-5 h-5 ${
              typeVote === 'multiple' ? 'rounded-md' : 'rounded-full'
            } border-2 flex items-center justify-center shrink-0 transition-colors ${
              isSelected
                ? 'bg-[#5B4DFF] border-[#5B4DFF] text-white'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
            }`}
          >
            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {choix.libelle}
          </span>
        </div>

        {/* Percentage & Vote count */}
        {showResults && (
          <div className="text-right shrink-0">
            <span className="text-sm font-extrabold text-[#5B4DFF] dark:text-[#7B61FF]">
              {choix.pourcentage}%
            </span>
            <span className="block text-[10px] text-gray-400 font-medium">
              {choix.nombreVotes} votes
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
