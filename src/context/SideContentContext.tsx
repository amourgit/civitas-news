import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SideContentContextType {
  sideContent: ReactNode | null;
  setSideContent: (content: ReactNode | null) => void;
  resetSideContent: () => void;
}

const SideContentContext = createContext<SideContentContextType>({
  sideContent: null,
  setSideContent: () => {},
  resetSideContent: () => {},
});

export const SideContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sideContent, setSideContentState] = useState<ReactNode | null>(null);

  const setSideContent = (content: ReactNode | null) => {
    setSideContentState(content);
  };

  const resetSideContent = () => {
    setSideContentState(null);
  };

  return (
    <SideContentContext.Provider value={{ sideContent, setSideContent, resetSideContent }}>
      {children}
    </SideContentContext.Provider>
  );
};

export const useSideContent = () => useContext(SideContentContext);

/**
 * Hook allowing a page or component to inject custom widgets into the right sidebar
 * upon mount, and automatically reset upon unmount.
 */
export function useSetSideContent(content: ReactNode, deps: any[] = []) {
  const { setSideContent, resetSideContent } = useSideContent();

  useEffect(() => {
    setSideContent(content);
    return () => {
      resetSideContent();
    };
  }, deps);
}
