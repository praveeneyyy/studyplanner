import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface LayoutContextType {
  isMobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  toggleMobileNav: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  // Automatically close mobile drawer whenever the student navigates to a new route
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  const openMobileNav = () => setIsMobileNavOpen(true);
  const closeMobileNav = () => setIsMobileNavOpen(false);
  const toggleMobileNav = () => setIsMobileNavOpen((prev) => !prev);

  return (
    <LayoutContext.Provider
      value={{
        isMobileNavOpen,
        openMobileNav,
        closeMobileNav,
        toggleMobileNav
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout(): LayoutContextType {
  const context = useContext(LayoutContext);
  if (!context) {
    // Provide a safe fallback so components can still render gracefully
    return {
      isMobileNavOpen: false,
      openMobileNav: () => {},
      closeMobileNav: () => {},
      toggleMobileNav: () => {}
    };
  }
  return context;
}
