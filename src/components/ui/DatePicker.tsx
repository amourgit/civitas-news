import React from 'react';
import { Calendar } from 'lucide-react';

export interface DatePickerProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  error?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  min,
  max,
  error,
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#5B4DFF]" />
          {label}
        </label>
      )}
      <input
        type="datetime-local"
        value={value || ''}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#242A5C] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5B4DFF] transition-all"
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};
