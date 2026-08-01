import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'pills' | 'underline' | 'chips';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  className = '',
}) => {
  if (variant === 'chips') {
    return (
      <div className={`flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 text-[11px] sm:text-xs font-semibold rounded-full transition-all duration-200 shrink-0 ${
                isActive
                  ? 'bg-[#5B4DFF] text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.2 text-[9px] sm:text-[10px] rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'underline') {
    return (
      <div className={`flex border-b border-gray-200 dark:border-gray-800 gap-3 sm:gap-6 overflow-x-auto no-scrollbar ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`pb-2 sm:pb-3 text-xs sm:text-sm font-semibold transition-all relative flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                isActive
                  ? 'text-[#5B4DFF] border-b-2 border-[#5B4DFF]'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span className="px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default pills
  return (
    <div className={`inline-flex p-0.5 sm:p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl sm:rounded-2xl gap-0.5 sm:gap-1 max-w-full overflow-x-auto no-scrollbar ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-200 shrink-0 whitespace-nowrap ${
              isActive
                ? 'bg-white dark:bg-[#1A1F4D] text-[#5B4DFF] dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className={`px-1.5 py-0.2 text-[10px] sm:text-xs rounded-full ${isActive ? 'bg-[#5B4DFF]/10 text-[#5B4DFF]' : 'bg-gray-200 dark:bg-gray-700 text-gray-600'}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
