import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  color?: string;
  height?: number;
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'bg-[#5B4DFF]',
  height = 8,
  showPercentage = false,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full flex items-center gap-3 ${className}`}>
      <div
        className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"
        style={{ height }}
      >
        <div
          className={`h-full ${color} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-10 text-right">
          {percentage.toFixed(0)}%
        </span>
      )}
    </div>
  );
};
