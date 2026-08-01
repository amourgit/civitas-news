import React from 'react';
import { useSideContent } from '../../context/SideContentContext';
import { GooglePartnerWidget } from '../widgets/GooglePartnerWidget';
import { AirtelGabonWidget } from '../widgets/AirtelGabonWidget';
import { CivicNewsWidget } from '../widgets/CivicNewsWidget';

export const SideContent: React.FC = () => {
  const { sideContent } = useSideContent();

  return (
    <aside
      id="app-side-content"
      aria-label="Contenu secondaire et publications partenaires"
      className="hidden lg:block w-[30%] min-w-[280px] max-w-[380px] shrink-0 sticky top-16 h-[calc(100vh-4.5rem)] overflow-y-auto overflow-x-hidden pr-1 pb-8 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 transition-all duration-200"
    >
      {sideContent ? (
        <div className="w-full max-w-full space-y-4 overflow-hidden break-words">
          {sideContent}
        </div>
      ) : (
        <div className="w-full max-w-full space-y-4 overflow-hidden break-words">
          {/* Default widgets when page does not provide custom side content */}
          <GooglePartnerWidget />
          <AirtelGabonWidget />
          <CivicNewsWidget />
        </div>
      )}
    </aside>
  );
};
