import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface NotificationDatePickerProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
}

export const NotificationDatePicker: React.FC<NotificationDatePickerProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 11, 1)); // Dec 2026 default or current

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfWeek = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const daysOfWeek = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDayClick = (dayNumber: number) => {
    const clicked = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);
    onSelectDate(clicked);
    setIsOpen(false);
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectDate(null);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-sm ${
          selectedDate
            ? 'bg-[#5B4DFF] text-white border-[#5B4DFF]'
            : 'bg-white dark:bg-[#1A1F4D] text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-[#5B4DFF]'
        }`}
      >
        <CalendarIcon className="w-3.5 h-3.5" />
        <span>
          {selectedDate
            ? selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
            : 'Sélectionner Date'}
        </span>
        {selectedDate && (
          <X className="w-3 h-3 ml-1 hover:opacity-80" onClick={clearSelection} />
        )}
      </button>

      {/* Calendar Popup Dropdown */}
      {isOpen && (
        <>
          {/* Overlay to click outside */}
          <div
            className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent backdrop-blur-[1px] sm:backdrop-blur-none"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed sm:absolute left-1/2 sm:left-auto sm:right-0 top-1/2 sm:top-full -translate-x-1/2 sm:translate-x-0 -translate-y-1/2 sm:translate-y-0 sm:mt-2 z-50 w-72 max-w-[calc(100vw-32px)] bg-white dark:bg-[#121638] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl p-3.5 text-xs animate-in fade-in zoom-in-95 duration-150">
            {/* Calendar Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-gray-800">
              <button
                onClick={handlePrevMonth}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-extrabold text-gray-900 dark:text-white font-display">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-gray-400 mb-1">
              {daysOfWeek.map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {/* Blank spaces for padding before day 1 */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`blank-${idx}`} className="h-7" />
              ))}

              {/* Days numbers */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum);
                const isSelected =
                  selectedDate &&
                  selectedDate.getDate() === dayNum &&
                  selectedDate.getMonth() === currentMonth.getMonth() &&
                  selectedDate.getFullYear() === currentMonth.getFullYear();

                return (
                  <button
                    key={dayNum}
                    onClick={() => handleDayClick(dayNum)}
                    className={`h-7 w-7 mx-auto rounded-lg font-semibold flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#5B4DFF] text-white font-bold shadow-md'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-950/50'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Clear date button */}
            <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-center">
              <button
                onClick={() => {
                  onSelectDate(null);
                  setIsOpen(false);
                }}
                className="text-[11px] font-bold text-[#5B4DFF] hover:underline"
              >
                Effacer le filtre de date
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
