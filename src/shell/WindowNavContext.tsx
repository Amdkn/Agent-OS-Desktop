import React, { createContext, useContext, useState } from 'react';

interface WindowNavContextType {
  activePage: string;
  detailLabel: string | null;
  navigateTo: (page: string, detail?: string | null) => void;
  backToActivePage: () => void;
}

const WindowNavContext = createContext<WindowNavContextType | null>(null);

export function WindowNavProvider({
  children,
  initialPage = 'Overview',
}: {
  children: React.ReactNode;
  initialPage?: string;
}) {
  const [activePage, setActivePage] = useState(initialPage);
  const [detailLabel, setDetailLabel] = useState<string | null>(null);

  const navigateTo = (page: string, detail: string | null = null) => {
    setActivePage(page);
    setDetailLabel(detail);
  };

  const backToActivePage = () => {
    setDetailLabel(null);
  };

  return (
    <WindowNavContext.Provider
      value={{
        activePage,
        detailLabel,
        navigateTo,
        backToActivePage,
      }}
    >
      {children}
    </WindowNavContext.Provider>
  );
}

export function useWindowNav() {
  const ctx = useContext(WindowNavContext);
  return ctx;
}
